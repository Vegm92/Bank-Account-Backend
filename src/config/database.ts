import { MongoClient, ServerApiVersion } from "mongodb";
import { logger } from "./logger";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bankapp";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    logger.info("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
    } else {
      logger.error(`MongoDB connection failed: Unknown error`);
    }
  }
}

export { client };
