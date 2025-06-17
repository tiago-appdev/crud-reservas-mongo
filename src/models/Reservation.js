import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'pending'
  },
  guests: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Reservation', reservationSchema);
