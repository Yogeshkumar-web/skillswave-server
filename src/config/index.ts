import dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("no .env file found");
}

export default {
  app: {
    port: process.env.PORT,
    apiPrefix: process.env.API_PREFIX,
  },
  logs: {
    morgan: process.env.MORGAN,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  token: {
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,
  },
};
