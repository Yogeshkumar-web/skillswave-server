import dotenv from 'dotenv';
import Joi from 'joi';

if (process.env.NODE_ENV !== 'production') {
  // Only load .env in non-production environments (i.e., locally)
  const envFound = dotenv.config();
  if (envFound.error) {
    throw new Error('🚨 No .env file found. Please create one!');
  }
}

// Define validation schema
const envSchema = Joi.object({
  CLIENT_URL: Joi.string().required(),
  PORT: Joi.number().required(),
  API_PREFIX: Joi.string().required(),
  MORGAN: Joi.string().required(),
  CORS_ORIGIN: Joi.string().required(),
  DATABASE_URL: Joi.string().uri().required(),
  RESEND_API_KEY: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  ACCESS_TOKEN_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
}).unknown();

// Validate and extract variables
const { error, value: validatedEnv } = envSchema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false,
});

if (error) {
  throw new Error(
    `🚨 Environment variable validation failed: ${error.message}`
  );
}

export default {
  app: {
    port: validatedEnv.PORT,
    apiPrefix: validatedEnv.API_PREFIX,
    morgan: validatedEnv.MORGAN,
    clientUrl: validatedEnv.CLIENT_URL,
  },
  cors: {
    origin: validatedEnv.CORS_ORIGIN,
  },
  database: {
    url: validatedEnv.DATABASE_URL,
  },
  cloudinary: {
    cloudName: validatedEnv.CLOUDINARY_CLOUD_NAME,
    apiKey: validatedEnv.CLOUDINARY_API_KEY,
    apiSecret: validatedEnv.CLOUDINARY_API_SECRET,
  },
  tokens: {
    accessToken: {
      secret: validatedEnv.ACCESS_TOKEN_SECRET,
      expiry: validatedEnv.ACCESS_TOKEN_EXPIRY,
    },
    refreshToken: {
      secret: validatedEnv.REFRESH_TOKEN_SECRET,
      expiry: validatedEnv.REFRESH_TOKEN_EXPIRY,
    },
  },
  googleAuth: {
    clientId: validatedEnv.GOOGLE_CLIENT_ID,
    clientSecret: validatedEnv.GOOGLE_CLIENT_SECRET,
    callbackUrl: validatedEnv.GOOGLE_CALLBACK_URL,
  },
  resend: {
    apiKey: validatedEnv.RESEND_API_KEY,
  },
};
