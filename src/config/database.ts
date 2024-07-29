import mongoose from "mongoose";
import { logger } from "./logger";
import { MONGODB_URI } from "../server";

export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Successfully connected to MongoDB!");
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
    } else {
      logger.error(`MongoDB connection failed: Unknown error`);
    }
    process.exit(1);
  }
}

mongoose.connection.on("error", (err: Error) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

export { mongoose };
