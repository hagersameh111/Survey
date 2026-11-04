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

import Form from "../../src/modules/form/form.model.js";
import ParticipantToken from "../../src/modules/response/participant-token.model.js";
import Response from "../../src/modules/response/response.model.js";
import {
  coordinateFormWrite,
  runInMongoTransaction,
} from "../../src/modules/form/form-write-fence.js";
import {
  findParticipantTokenForSubmission,
  hashParticipantToken,
  isValidParticipantToken,
  issueParticipantToken,
} from "../../src/modules/response/participant-token.service.js";

const FORM_ID = "66a000000000000000000001";
const RAW_TOKEN = "A".repeat(43);
const TOKEN_HASH = hashParticipantToken(RAW_TOKEN);
const SESSION = { transaction: "test-session" };

beforeEach(() => {
  vi.clearAllMocks();
  runInMongoTransaction.mockImplementation((operation) => operation(SESSION));
  coordinateFormWrite.mockResolvedValue(true);
});

afterEach(() => vi.restoreAllMocks());

describe("participant token service", () => {
  it("generates a URL-safe 256-bit token and persists only its hash", async () => {
    vi.spyOn(Form, "findOne").mockResolvedValue({
      _id: FORM_ID,
      status: "published",
      access: { type: "open" },
      settings: { identityMode: "anonymous" },
    });
    const create = vi.spyOn(ParticipantToken, "create").mockResolvedValue({});

    const rawToken = await issueParticipantToken(FORM_ID);

    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(coordinateFormWrite).toHaveBeenCalledWith(FORM_ID, SESSION, {
      status: "published",
      "access.type": "open",
      $or: [
        { "settings.identityMode": "anonymous" },
        { "settings.identityMode": { $exists: false } },
      ],
    });
    expect(create).toHaveBeenCalledWith([expect.objectContaining({
      form: FORM_ID,
      tokenHash: hashParticipantToken(rawToken),
      consumedAt: null,
    })], { session: SESSION });
    expect(create.mock.calls[0][0][0]).not.toHaveProperty("rawToken");
    expect(create.mock.calls[0][0][0]).not.toHaveProperty("participantToken");
    expect(create.mock.calls[0][0][0].tokenHash).not.toBe(rawToken);
  });

  it.each([
    { status: "draft", access: "open", identityMode: "anonymous" },
    { status: "closed", access: "open", identityMode: "anonymous" },
    { status: "published", access: "code", identityMode: "anonymous" },
    { status: "published", access: "open", identityMode: "identified" },
  ])("does not issue for ineligible Forms: %o", async ({ status, access, identityMode }) => {
    vi.spyOn(Form, "findOne").mockResolvedValue({
      _id: FORM_ID,
      status,
      access: { type: access },
      settings: { identityMode },
    });
    const create = vi.spyOn(ParticipantToken, "create");

    await expect(issueParticipantToken(FORM_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(create).not.toHaveBeenCalled();
  });

  it("does not create a token if the Form fence no longer matches", async () => {
    vi.spyOn(Form, "findOne").mockResolvedValue({
      _id: FORM_ID,
      status: "published",
      access: { type: "open" },
      settings: { identityMode: "anonymous" },
    });
    coordinateFormWrite.mockResolvedValueOnce(false);
    const create = vi.spyOn(ParticipantToken, "create");

    await expect(issueParticipantToken(FORM_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(create).not.toHaveBeenCalled();
  });

  it("validates token format before querying and scopes lookup by Form and hash", async () => {
    const findOne = vi.spyOn(ParticipantToken, "findOne").mockResolvedValue({
      _id: "participant-token-id",
      consumedAt: null,
    });
    vi.spyOn(Response, "exists").mockResolvedValue(null);

    await expect(findParticipantTokenForSubmission(FORM_ID, "bad"))
      .rejects.toMatchObject({ statusCode: 401 });
    expect(findOne).not.toHaveBeenCalled();

    const result = await findParticipantTokenForSubmission(FORM_ID, RAW_TOKEN);
    expect(findOne).toHaveBeenCalledWith({ form: FORM_ID, tokenHash: TOKEN_HASH });
    expect(result.tokenHash).toBe(TOKEN_HASH);
  });

  it("rejects unknown and consumed tokens with their expected statuses", async () => {
    vi.spyOn(Response, "exists").mockResolvedValue(null);
    vi.spyOn(ParticipantToken, "findOne")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: "participant-token-id", consumedAt: new Date() });

    await expect(findParticipantTokenForSubmission(FORM_ID, RAW_TOKEN))
      .rejects.toMatchObject({ statusCode: 401 });
    await expect(findParticipantTokenForSubmission(FORM_ID, RAW_TOKEN))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
