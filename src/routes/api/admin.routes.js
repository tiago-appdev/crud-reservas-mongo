import express from 'express';
import { auth } from '../../middlewares/auth.middleware.js';
import {
  getAdminDashboard,
  getOccupancyReport,
  bulkUpdateTableAvailability,
  getReservationsByDateRange
} from '../../controllers/api/admin.controllers.js';

const router = express.Router();
// localhost:3000/
router.get('/dashboard', auth, getAdminDashboard);
router.get('/occupancy-report', auth, getOccupancyReport);
router.post('/tables/bulk-update', auth, bulkUpdateTableAvailability);
router.get('/reservations', auth, getReservationsByDateRange);

export default router;