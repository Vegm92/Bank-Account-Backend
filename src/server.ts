import app from "./app";
import { connectToMongoDB } from "./config/database";
import { logger } from "./config/logger";
import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bankapp";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start the server: ${error.message}`);
});
