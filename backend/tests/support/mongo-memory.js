import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongoReplSet;

export const startTestDatabase = async () => {
  if (mongoReplSet) {
    throw new Error("The in-memory test database is already running");
  }

  if (mongoose.connection.readyState !== 0) {
    throw new Error("Refusing to reuse an existing MongoDB connection in tests");
  }

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  const uri = replSet.getUri("survey_backend_test");

  try {
    await mongoose.connect(uri);
    mongoReplSet = replSet;
    return uri;
  } catch (error) {
    await mongoose.disconnect().catch(() => {});
    await replSet.stop().catch(() => {});
    throw error;
  }
};

export const stopTestDatabase = async () => {
  const replSet = mongoReplSet;
  mongoReplSet = undefined;

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    if (replSet) {
      await replSet.stop();
    }
  }
};
