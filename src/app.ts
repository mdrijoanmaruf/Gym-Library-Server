import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import mediaRoutes from './modules/media/media.routes';
import savedExerciseRoutes from './modules/savedExercise/savedExercise.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

import { connectDB } from './config/db';

// Global Middleware
app.use(helmet());
app.use(cors({ 
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'https://gym.rijoan.com'], 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Ensure DB is connected for serverless environments (like Vercel)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Basic Health Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GymLibrary Server is running!' });
});

// Mount modules
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/saved-exercises', savedExerciseRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
