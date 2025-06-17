import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'v8virtuosos';

export const MONGODB_URI = process.env.MONGODB_URI;
