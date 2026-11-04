import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import Form from "../../src/modules/form/form.model.js";

describe("Form optimistic concurrency configuration", () => {
  it("uses Mongoose's standard version key and optimistic concurrency", () => {
    expect(Form.schema.options.versionKey).toBe("__v");
    expect(Form.schema.options.optimisticConcurrency).toBe(true);
    expect(Form.schema.path("__v")).toBeDefined();
  });

  it("omits the internal version key from object and JSON representations", () => {
    const form = new Form({
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      title: "Version visibility",
    });
    form.__v = 7;

    expect(form.toObject()).not.toHaveProperty("__v");
    expect(form.toJSON()).not.toHaveProperty("__v");
  });
});
