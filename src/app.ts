import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import envVariables from './config';
import userRouter from './routes/user.route'

const app = express();

// Morgan for logging
const morganFormat = envVariables.app.morgan || 'common';
app.use(morgan(morganFormat));

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = envVariables.cors.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
};

// Enable CORS
app.use(cors(corsOptions));

// Body parsers for JSON and URL-encoded data
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Static files
app.use(express.static('public'));

// Cookie parser
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// API routes 
app.use(`${envVariables.app.apiPrefix}`, userRouter);

export { app };