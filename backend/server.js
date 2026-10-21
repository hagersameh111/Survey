
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = Number(process.env.PORT || 2000);

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error("PORT must be a valid port number");
    }

    await connectDB();

    const server = app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
};

startServer();
