import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import envVariables from "./config/env-variables";

const app = express();

app.use("/", (req,res) => {
  res.send("Server is running!")
})

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(morgan(`${envVariables.MORGAN}`));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import

//routes declaration
app.use(`${envVariables.API_PREFIX}`, () => {});

export { app };
