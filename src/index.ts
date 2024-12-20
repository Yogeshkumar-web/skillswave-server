import { app } from "./app";
import envVariables from "./config";
import connectWithRetry, { disconnectDB } from "./database"; 
import logger from "./utils/logger"

const startServer = async () => {
  try {
    await connectWithRetry(); // Retry logic for database connection
    logger.info("✅ MongoDB connected successfully.");

    const server = app.listen(envVariables.PORT || 8080, () => {
      logger.info(`⚙️ Server is running at port : ${envVariables.PORT}`);
    });

    // Graceful shutdown handlers
    const shutdownHandler = async (signal: string) => {
      logger.info(`🛑 ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info("HTTP server closed.");
      });
      await disconnectDB(); 
      process.exit(0);
    };

    process.on("SIGINT", () => shutdownHandler("SIGINT"));
    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  } catch (err) {
    logger.error("❌ Failed to start the server: ", err);
    process.exit(1); 
  }
};

startServer();
