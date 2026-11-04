import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-three-concurrency-test-secret";
const TEST_EXPIRES_IN = "1h";

const validPages = (label = "Published snapshot") => [
  {
    type: "welcome",
    title: label,
    blocks: [{ type: "heading", data: { text: "Welcome" } }],
  },
  {
    type: "questions",
    title: "Questions",
    blocks: [{ type: "short_text", data: { question: `Prompt ${label}`, required: false } }],
  },
  {
    type: "ending",
    title: "Ending",
    blocks: [{ type: "text", data: { text: "Thank you" } }],
  },
];

const persistedPages = (label = "Published snapshot") =>
  validPages(label).map((page, pageIndex) => ({
    ...page,
    order: pageIndex + 1,
    blocks: page.blocks.map((block, blockIndex) => ({
      ...block,
      order: blockIndex + 1,
    })),
  }));

describe("Form optimistic concurrency", () => {
  let previousJwtSecret;
  let previousJwtExpiresIn;

  beforeAll(async () => {
    await startTestDatabase();
    await Form.init();
    await User.init();

    previousJwtSecret = process.env.JWT_SECRET;
    previousJwtExpiresIn = process.env.JWT_EXPIRES_IN;
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_EXPIRES_IN = TEST_EXPIRES_IN;
  });

  afterAll(async () => {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }

    if (previousJwtExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = previousJwtExpiresIn;
    }

    await stopTestDatabase();
  });

  beforeEach(async () => {
    await Form.deleteMany({});
    await User.deleteMany({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const registerAndLogin = async () => {
    const email = "concurrency-owner@example.test";
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "Concurrency",
        lastName: "Owner",
        email,
        password: "phase3-test-password",
      })
      .expect(201);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "phase3-test-password" })
      .expect(200);

    return {
      id: login.body.data.user._id,
      token: login.body.data.token,
    };
  };

  const makeDraft = (owner) =>
    Form.create({
      owner,
      title: "Concurrency test Form",
      status: "draft",
      settings: { identityMode: "anonymous" },
      access: { type: "open" },
      pages: persistedPages(),
    });

  const coordinateFindOneReads = (formId, expectedReaders = 2) => {
    const originalFindOne = Form.findOne;
    let readers = 0;
    let release;
    const gate = new Promise((resolveGate) => {
      release = resolveGate;
    });

    const spy = vi.spyOn(Form, "findOne").mockImplementation(function (...args) {
      const query = originalFindOne.apply(this, args);
      if (args[0]?._id?.toString() !== formId.toString()) {
        return query;
      }

      const execute = query.exec.bind(query);
      query.exec = async (...execArgs) => {
        const document = await execute(...execArgs);
        readers += 1;
        if (readers === expectedReaders) {
          release();
        }
        await gate;
        return document;
      };

      return query;
    });

    return { spy, release };
  };

  const pauseSave = (shouldPause) => {
    const originalSave = Form.prototype.save;
    let notifyReached;
    let release;
    let hasPaused = false;
    const reached = new Promise((resolveReached) => {
      notifyReached = resolveReached;
    });
    const gate = new Promise((resolveGate) => {
      release = resolveGate;
    });

    const spy = vi.spyOn(Form.prototype, "save").mockImplementation(async function (...args) {
      if (!hasPaused && shouldPause(this)) {
        hasPaused = true;
        notifyReached();
        await gate;
      }

      return originalSave.apply(this, args);
    });

    return { reached, release, spy };
  };

  it("rejects a stale second save from independently loaded Draft documents", async () => {
    const owner = new mongoose.Types.ObjectId();
    const created = await makeDraft(owner);
    const first = await Form.findById(created._id);
    const stale = await Form.findById(created._id);

    first.title = "First save wins";
    await first.save();

    stale.title = "Stale save must fail";
    await expect(stale.save()).rejects.toMatchObject({ name: "VersionError" });

    const stored = await Form.findById(created._id);
    expect(stored.title).toBe("First save wins");
    expect(stored.__v).toBe(1);
  });

  it("returns a conflict when a builder save reaches persistence after publication", async () => {
    const owner = await registerAndLogin();
    const form = await makeDraft(owner.id);
    const saveGate = pauseSave((document) => document.isModified("pages"));

    try {
      const builderRequest = request(app)
        .put(`/api/v1/forms/${form._id}/builder`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ pages: validPages("Late builder change") })
        .then((response) => response);

      await saveGate.reached;

      const published = await request(app)
        .post(`/api/v1/forms/${form._id}/publish`)
        .set("Authorization", `Bearer ${owner.token}`)
        .expect(200);
      expect(published.body.data.status).toBe("published");
      expect(published.body.data).not.toHaveProperty("__v");

      saveGate.release();
      const staleSave = await builderRequest;
      expect(staleSave.status).toBe(409);
      expect(staleSave.body).toMatchObject({
        success: false,
        message: "Form was changed by another request. Reload and try again.",
      });

      const stored = await Form.findById(form._id);
      expect(stored.status).toBe("published");
      expect(stored.pages[0].title).toBe("Published snapshot");
      expect(stored.pages[1].blocks[0].data.question).toBe("Prompt Published snapshot");
    } finally {
      saveGate.release();
      saveGate.spy.mockRestore();
    }
  });

  it("allows only one of two concurrent builder saves based on the same version", async () => {
    const owner = await registerAndLogin();
    const form = await makeDraft(owner.id);
    const readBarrier = coordinateFindOneReads(form._id);

    try {
      const saves = await Promise.all([
        request(app)
          .put(`/api/v1/forms/${form._id}/builder`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ pages: validPages("Builder A") }),
        request(app)
          .put(`/api/v1/forms/${form._id}/builder`)
          .set("Authorization", `Bearer ${owner.token}`)
          .send({ pages: validPages("Builder B") }),
      ]);

      expect(saves.map((response) => response.status).sort()).toEqual([200, 409]);
      const winner = saves.find((response) => response.status === 200);
      expect(winner.body.data).not.toHaveProperty("__v");
      const stored = await Form.findById(form._id);
      expect(stored.pages[0].title).toBe(winner.body.data.pages[0].title);
      expect(stored.__v).toBe(1);
    } finally {
      readBarrier.release();
      readBarrier.spy.mockRestore();
    }
  });

  it("allows only one concurrent publish based on the same Draft version", async () => {
    const owner = await registerAndLogin();
    const form = await makeDraft(owner.id);
    const readBarrier = coordinateFindOneReads(form._id);

    try {
      const publishes = await Promise.all([
        request(app)
          .post(`/api/v1/forms/${form._id}/publish`)
          .set("Authorization", `Bearer ${owner.token}`),
        request(app)
          .post(`/api/v1/forms/${form._id}/publish`)
          .set("Authorization", `Bearer ${owner.token}`),
      ]);

      expect(publishes.map((response) => response.status).sort()).toEqual([200, 409]);
      expect(publishes.find((response) => response.status === 200).body.data.status)
        .toBe("published");
      const stored = await Form.findById(form._id);
      expect(stored.status).toBe("published");
      expect(stored.__v).toBe(1);
    } finally {
      readBarrier.release();
      readBarrier.spy.mockRestore();
    }
  });

  it.each([
    {
      name: "access settings",
      endpoint: (formId) => `/api/v1/forms/${formId}/access`,
      payload: { type: "code", code: "test-code-123" },
      shouldPause: (document) => document.access?.type === "code",
      verifyStored: (stored) => expect(stored.access.type).toBe("open"),
      conflictBody: { message: "Form was changed by another request. Reload and try again." },
    },
    {
      name: "identity settings",
      endpoint: (formId) => `/api/v1/forms/${formId}/settings/identity-mode`,
      payload: { identityMode: "identified" },
      shouldPause: (document) => document.settings?.identityMode === "identified",
      verifyStored: (stored) => expect(stored.settings.identityMode).toBe("anonymous"),
      conflictBody: {
        success: false,
        message: "Form was changed by another request. Reload and try again.",
      },
    },
  ])("rejects stale $name updates after publication", async ({ endpoint, payload, shouldPause, verifyStored, conflictBody }) => {
    const owner = await registerAndLogin();
    const form = await makeDraft(owner.id);
    const saveGate = pauseSave(shouldPause);

    try {
      const settingsRequest = request(app)
        .patch(endpoint(form._id))
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload)
        .then((response) => response);

      await saveGate.reached;

      await request(app)
        .post(`/api/v1/forms/${form._id}/publish`)
        .set("Authorization", `Bearer ${owner.token}`)
        .expect(200);

      saveGate.release();
      const staleSettings = await settingsRequest;
      expect(staleSettings.status).toBe(409);
      expect(staleSettings.body).toMatchObject(conflictBody);

      const stored = await Form.findById(form._id);
      expect(stored.status).toBe("published");
      verifyStored(stored);
    } finally {
      saveGate.release();
      saveGate.spy.mockRestore();
    }
  });
});
