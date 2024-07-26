import app from "./app";
import { connectToMongoDB } from "./config/database";
import { logger } from "./config/logger";

// Iniciar el servidor
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start the server: ${error.message}`);
});
