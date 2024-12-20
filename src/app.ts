import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import envVariables from "./config";

const app = express();

// Morgan for logging
const morganFormat = envVariables.app.morgan || "common";
app.use(morgan(morganFormat));

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);

// Enable CORS
app.use(
  cors({
    origin: envVariables.cors.origin,
    credentials: true,
  })
);

// Body parsers for JSON and URL-encoded data
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static files
app.use(express.static("public"));

// Cookie parser
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// API routes (Placeholder)
app.use(`${envVariables.app.apiPrefix}`, () => {
  // Define your routes here
});

export { app };
