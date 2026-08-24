import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Basic Health Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GymLibrary Server is running!' });
});

// Mount modules
app.use('/api/auth', authRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
