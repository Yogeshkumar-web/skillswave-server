import mongoose from "mongoose";
import logger from "../utils/logger"
import envVariables from "../config";


const connectDB = async (): Promise<void> => {
  const dbURI = envVariables.database.url
  await mongoose.connect(dbURI);
};

const connectWithRetry = async (retries = 5, delay = 3000): Promise<void> => {
  while (retries) {
    try {
      await connectDB();
      logger.info("✅ MongoDB connected successfully.");
      return;
    } catch (err) {
      retries -= 1;
      logger.error(`❌ MongoDB connection failed. Retries left: ${retries}`);
      if (retries === 0) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info("✅ MongoDB connection closed.");
};

export default connectWithRetry;
export { disconnectDB };
