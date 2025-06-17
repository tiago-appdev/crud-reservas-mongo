import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  table_number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  available: { type: Boolean, default: true },
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Table', tableSchema);
