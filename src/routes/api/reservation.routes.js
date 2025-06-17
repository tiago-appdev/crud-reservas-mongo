import { Router } from 'express';
import {
  createReservation,
  getAllReservations,
  getUserReservations,
  getReservation,
  updateReservation,
  deleteReservation
} from '../../controllers/api/reservation.controllers.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();
// /api/reservations+
router.post('/', auth, createReservation);
router.get('/', auth, getAllReservations);
router.get('/my', auth, getUserReservations);
router.get('/:id', auth, getReservation);
router.put('/:id', auth, updateReservation);
router.delete('/:id', auth, deleteReservation);

export default router;
