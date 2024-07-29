import mongoose from "mongoose";
import { logger } from "./logger";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bankapp";

export async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
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

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

export { mongoose };
