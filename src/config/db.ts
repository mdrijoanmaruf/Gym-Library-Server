import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB:`, error);
  }
};
