import { connect } from 'mongoose';
import { MONGODB_URI } from './config.js';

const connectDB = async () => {
  try {
    await connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
