import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/modules/form/form-write-fence.js", () => ({
  runInMongoTransaction: vi.fn(),
  coordinateFormWrite: vi.fn(),
  createTransactionConflictError: () => Object.assign(
    new Error("The operation conflicted with another request. Please retry."),
    { statusCode: 409 }
  ),
  isTransactionConflict: (error) => error?.code === 112 || error?.hasErrorLabel?.("TransientTransactionError"),
}));

vi.mock("../../src/modules/response/participant-token.service.js", () => ({
  findParticipantTokenForSubmission: vi.fn(),
  markParticipantTokenConsumed: vi.fn(),
  isValidParticipantToken: (token) =>
    typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token),
}));

import Form from "../../src/modules/form/form.model.js";
import Response from "../../src/modules/response/response.model.js";
import { submitResponse } from "../../src/modules/response/response.service.js";
import {
  coordinateFormWrite,
  runInMongoTransaction,
} from "../../src/modules/form/form-write-fence.js";
import {
  findParticipantTokenForSubmission,
  markParticipantTokenConsumed,
} from "../../src/modules/response/participant-token.service.js";

const FORM_ID = "66a000000000000000000001";
const USER_ID = "66a000000000000000000002";
const RESPONSE_ID = "66a000000000000000000003";
const SUBMITTED_AT = new Date("2026-10-30T10:00:00.000Z");
const SESSION = { transaction: "test-session" };
const TOKEN_ID = "66a000000000000000000004";
const RAW_TOKEN = "A".repeat(43);
const IDs = {
  participantEmail: "66a000000000000000000101",
  participantText: "66a000000000000000000102",
  questionEmail: "66a000000000000000000201",
  questionChoice: "66a000000000000000000202",
  display: "66a000000000000000000301",
  unknown: "66a000000000000000000401",
};

const block = (type, data, id) => ({ _id: id, type, data });
const page = (type, blocks) => ({ type, blocks });
const form = (pages, identityMode = "identified") => ({
  _id: FORM_ID,
  status: "published",
  access: { type: "open" },
  settings: { identityMode },
  pages,
});

const submit = (answers, context = { userId: USER_ID }) =>
  submitResponse(FORM_ID, { answers }, context);

const errorWithStatus = (statusCode) =>
  expect.objectContaining({ statusCode });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Form, "findById").mockResolvedValue(form([]));
  coordinateFormWrite.mockResolvedValue(true);
  runInMongoTransaction.mockImplementation((operation) => operation(SESSION));
  findParticipantTokenForSubmission.mockResolvedValue({
    participantToken: { _id: TOKEN_ID, consumedAt: null },
    tokenHash: "a".repeat(64),
  });
  markParticipantTokenConsumed.mockResolvedValue({ _id: TOKEN_ID });
  vi.spyOn(Response, "create").mockResolvedValue([{
    _id: RESPONSE_ID,
    submittedAt: SUBMITTED_AT,
  }]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitResponse page-based classification", () => {
  it("stores fields according to their actual page, regardless of input type", async () => {
    Form.findById.mockResolvedValue(
      form([
        page("participant_info", [
          block("email", { question: "Contact email", required: true }, IDs.participantEmail),
          block("short_text", { question: "Preferred name", required: true }, IDs.participantText),
        ]),
        page("questions", [
          block("email", { question: "Email-related survey question", required: true }, IDs.questionEmail),
          block(
            "single_choice",
            { question: "Choice", required: true, options: [{ label: "Option A" }] },
            IDs.questionChoice
          ),
        ]),
      ])
    );

    await submit([
      { questionId: IDs.participantEmail, value: "person@example.com" },
      { questionId: IDs.participantText, value: "Sam" },
      { questionId: IDs.questionEmail, value: "survey@example.com" },
      { questionId: IDs.questionChoice, value: "Option A" },
    ]);

    expect(Response.create).toHaveBeenCalledWith([{
      form: FORM_ID,
      respondentUser: USER_ID,
      participantInfo: [
        { questionId: IDs.participantEmail, value: "person@example.com" },
        { questionId: IDs.participantText, value: "Sam" },
      ],
      answers: [
        { questionId: IDs.questionEmail, value: "survey@example.com" },
        { questionId: IDs.questionChoice, value: "Option A" },
      ],
    }], { session: SESSION });
    expect(coordinateFormWrite).toHaveBeenCalledWith(FORM_ID, SESSION, {
      status: "published",
      "access.type": "open",
      "settings.identityMode": "identified",
    });
  });

  it.each(["participant_info", "questions"])(
    "requires nonblank values on %s pages",
    async (pageType) => {
      Form.findById.mockResolvedValue(
        form([page(pageType, [block("short_text", { question: "Required", required: true }, IDs.participantText)])])
      );

      await expect(submit([])).rejects.toMatchObject(errorWithStatus(400));
      expect(Response.create).not.toHaveBeenCalled();
    }
  );

  it("omits optional blank values from both categories", async () => {
    Form.findById.mockResolvedValue(
      form([
        page("participant_info", [block("short_text", { question: "Optional", required: false }, IDs.participantText)]),
        page("questions", [block("short_text", { question: "Optional", required: false }, IDs.questionEmail)]),
      ])
    );

    await submit([
      { questionId: IDs.participantText, value: "   " },
      { questionId: IDs.questionEmail, value: "" },
    ]);

    expect(Response.create).toHaveBeenCalledWith([{
      form: FORM_ID,
      respondentUser: USER_ID,
      participantInfo: [],
      answers: [],
    }], { session: SESSION });
  });

  it("rejects unknown and display-only block IDs", async () => {
    Form.findById.mockResolvedValue(
      form([page("questions", [block("heading", { text: "Display" }, IDs.display)])])
    );

    await expect(submit([{ questionId: IDs.unknown, value: "x" }])).rejects.toMatchObject(
      errorWithStatus(400)
    );
    await expect(submit([{ questionId: IDs.display, value: "x" }])).rejects.toMatchObject(
      errorWithStatus(400)
    );
  });

  it("rejects duplicate submitted IDs, including case variants", async () => {
    Form.findById.mockResolvedValue(
      form([page("questions", [block("short_text", { question: "Text" }, IDs.questionEmail)])])
    );

    await expect(
      submit([
        { questionId: IDs.questionEmail, value: "first" },
        { questionId: IDs.questionEmail.toUpperCase(), value: "second" },
      ])
    ).rejects.toMatchObject(errorWithStatus(400));
  });

  it("rejects duplicate answerable block IDs in a Form", async () => {
    Form.findById.mockResolvedValue(
      form([
        page("participant_info", [block("short_text", { question: "Participant" }, IDs.questionEmail)]),
        page("questions", [block("short_text", { question: "Survey" }, IDs.questionEmail)]),
      ])
    );

    await expect(submit([])).rejects.toMatchObject(errorWithStatus(500));
  });

  it.each(["welcome", "ending"])(
    "rejects answerable blocks on %s pages",
    async (pageType) => {
      Form.findById.mockResolvedValue(
        form([page(pageType, [block("short_text", { question: "Unsupported" }, IDs.questionEmail)])])
      );

      await expect(submit([])).rejects.toMatchObject(errorWithStatus(500));
    }
  );

  it("uses the authenticated user ID for identified responses", async () => {
    Form.findById.mockResolvedValue(form([]));

    await submit([]);

    expect(Response.create).toHaveBeenCalledWith(
      [expect.objectContaining({ respondentUser: USER_ID })],
      { session: SESSION }
    );
  });

  it("preserves the current anonymous missing-token response", async () => {
    Form.findById.mockResolvedValue(form([], "anonymous"));

    await expect(submit([])).rejects.toMatchObject(errorWithStatus(401));
    expect(Response.create).not.toHaveBeenCalled();
  });

  it("verifies and consumes an anonymous token in the same transaction as Response creation", async () => {
    Form.findById.mockResolvedValue(form([], "anonymous"));

    const result = await submitResponse(FORM_ID, { answers: [] }, {
      participantToken: RAW_TOKEN,
    });

    expect(coordinateFormWrite).toHaveBeenCalledWith(FORM_ID, SESSION, {
      status: "published",
      "access.type": "open",
      $or: [
        { "settings.identityMode": "anonymous" },
        { "settings.identityMode": { $exists: false } },
      ],
    });
    expect(findParticipantTokenForSubmission).toHaveBeenCalledWith(
      FORM_ID,
      RAW_TOKEN,
      { session: SESSION }
    );
    expect(Response.create).toHaveBeenCalledWith([expect.objectContaining({
      form: FORM_ID,
      participantTokenHash: "a".repeat(64),
    })], { session: SESSION });
    expect(markParticipantTokenConsumed).toHaveBeenCalledWith(
      TOKEN_ID,
      FORM_ID,
      SESSION
    );
    expect(result).toEqual({ responseId: RESPONSE_ID, submittedAt: SUBMITTED_AT });
  });

  it("repairs an unconsumed legacy token marker transactionally without creating a duplicate Response", async () => {
    Form.findById.mockResolvedValue(form([], "anonymous"));
    findParticipantTokenForSubmission.mockResolvedValueOnce({
      participantToken: { _id: TOKEN_ID, consumedAt: null },
      tokenHash: "a".repeat(64),
      alreadySubmitted: true,
    });

    await expect(submitResponse(FORM_ID, { answers: [] }, {
      participantToken: RAW_TOKEN,
    })).rejects.toMatchObject(errorWithStatus(409));

    expect(markParticipantTokenConsumed).toHaveBeenCalledWith(
      TOKEN_ID,
      FORM_ID,
      SESSION
    );
    expect(Response.create).not.toHaveBeenCalled();
  });

  it("rejects persistence when the conditional Form fence no longer matches", async () => {
    coordinateFormWrite.mockResolvedValueOnce(false);

    await expect(submit([])).rejects.toMatchObject(errorWithStatus(404));
    expect(Response.create).not.toHaveBeenCalled();
  });

  it("maps duplicate-key errors to the existing conflict status", async () => {
    Form.findById.mockResolvedValue(form([]));
    Response.create.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));

    await expect(submit([])).rejects.toMatchObject(errorWithStatus(409));
  });
});

const answerTypeCases = [
  {
    type: "short_text",
    data: { question: "Text", required: true, minLength: 3, maxLength: 10 },
    value: "abc",
    invalid: "a",
  },
  {
    type: "long_text",
    data: { question: "Long text", required: true },
    value: "long response",
    invalid: 4,
  },
  {
    type: "email",
    data: { question: "Email", required: true },
    value: "person@example.com",
    invalid: "not-an-email",
  },
  {
    type: "phone",
    data: { question: "Phone", required: true },
    value: "+201000000000",
    invalid: 201000000000,
  },
  {
    type: "number",
    data: { question: "Number", required: true, min: 2, max: 8 },
    value: 5,
    invalid: 1,
  },
  {
    type: "date",
    data: { question: "Date", required: true, minDate: "2024-01-01", maxDate: "2024-12-31" },
    value: "2024-02-29",
    invalid: "2024-02-30",
  },
  {
    type: "single_choice",
    data: { question: "Single", required: true, options: [{ label: "A" }, { label: "B" }] },
    value: "A",
    invalid: "C",
  },
  {
    type: "multiple_choice",
    data: { question: "Multiple", required: true, options: [{ label: "A" }, { label: "B" }], maxSelections: 2 },
    value: ["A", "B"],
    invalid: ["A", "A"],
  },
  {
    type: "dropdown",
    data: { question: "Dropdown", required: true, options: [{ label: "A" }, { label: "B" }] },
    value: "B",
    invalid: "C",
  },
  {
    type: "rating",
    data: { question: "Rating", required: true, style: "stars", scale: 5 },
    value: 4,
    invalid: 0,
  },
];

describe.each(["participant_info", "questions"])(
  "%s field answer validation",
  (pageType) => {
    describe.each(answerTypeCases)("$type", ({ type, data, value, invalid }) => {
      beforeEach(() => {
        Form.findById.mockResolvedValue(
          form([page(pageType, [block(type, data, IDs.questionEmail)])])
        );
      });

      it("accepts valid configured values", async () => {
        await expect(submit([{ questionId: IDs.questionEmail, value }])).resolves.toMatchObject({
          responseId: RESPONSE_ID,
          submittedAt: SUBMITTED_AT,
        });
      });

      it("rejects invalid configured values", async () => {
        await expect(
          submit([{ questionId: IDs.questionEmail, value: invalid }])
        ).rejects.toMatchObject(errorWithStatus(400));
      });
    });
  }
);

describe("multiple-choice empty and selection behavior", () => {
  const multipleChoiceBlock = (required) =>
    block(
      "multiple_choice",
      {
        question: "Select options",
        required,
        options: [{ label: "A" }, { label: "B" }, { label: "C" }],
        maxSelections: 2,
      },
      IDs.questionChoice
    );

  it("omits an empty array for an optional multiple-choice question", async () => {
    Form.findById.mockResolvedValue(
      form([page("questions", [multipleChoiceBlock(false)])])
    );

    await submit([{ questionId: IDs.questionChoice, value: [] }]);

    expect(Response.create).toHaveBeenCalledWith([{
      form: FORM_ID,
      respondentUser: USER_ID,
      participantInfo: [],
      answers: [],
    }], { session: SESSION });
  });

  it("rejects an empty array for a required multiple-choice question", async () => {
    Form.findById.mockResolvedValue(
      form([page("questions", [multipleChoiceBlock(true)])])
    );

    await expect(
      submit([{ questionId: IDs.questionChoice, value: [] }])
    ).rejects.toMatchObject(errorWithStatus(400));
    expect(Response.create).not.toHaveBeenCalled();
  });

  it("accepts valid selections and rejects unknown or excessive selections", async () => {
    Form.findById.mockResolvedValue(
      form([page("questions", [multipleChoiceBlock(true)])])
    );

    await submit([{ questionId: IDs.questionChoice, value: ["A", "C"] }]);
    expect(Response.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        answers: [{ questionId: IDs.questionChoice, value: ["A", "C"] }],
      })],
      { session: SESSION }
    );

    Response.create.mockClear();
    await expect(
      submit([{ questionId: IDs.questionChoice, value: ["not-an-option"] }])
    ).rejects.toMatchObject(errorWithStatus(400));
    await expect(
      submit([{ questionId: IDs.questionChoice, value: ["A", "B", "C"] }])
    ).rejects.toMatchObject(errorWithStatus(400));
    expect(Response.create).not.toHaveBeenCalled();
  });
});
