import Reservation from '../../models/Reservation.js';
import Table from '../../models/Table.js';

/**
 * Get admin dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch dashboard statistics
    const totalTables = await Table.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    const availableTables = await Table.countDocuments({ available: true });

    // Get today's reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReservations = await Reservation.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Send dashboard data as JSON response
    res.json({
      totalTables,
      totalReservations,
      availableTables,
      todayReservations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get occupancy report for a date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOccupancyReport = async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch reservations for the given date range
    const reservations = await Reservation.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).populate('table_id');

    // Calculate daily occupancy
    const occupancyData = {};
    const totalTables = await Table.countDocuments();

    reservations.forEach((reservation) => {
      const dateKey = reservation.date.toISOString().split('T')[0];
      if (!occupancyData[dateKey]) {
        occupancyData[dateKey] = {
          totalReservations: 0,
          totalGuests: 0
        };
      }
      occupancyData[dateKey].totalReservations++;
      occupancyData[dateKey].totalGuests += reservation.guests;
    });

    // Calculate occupancy percentage
    Object.keys(occupancyData).forEach((date) => {
      occupancyData[date].occupancyRate =
				(occupancyData[date].totalReservations / totalTables) * 100;
    });

    res.json(occupancyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bulk update table availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bulkUpdateTableAvailability = async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { tableIds, available } = req.body;

    // Update multiple tables' availability status
    const result = await Table.updateMany(
      { _id: { $in: tableIds } },
      { $set: { available } }
    );

    res.json({
      message: 'Tables updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get reservations for a specific date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getReservationsByDateRange = async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;

    // Fetch reservations within the specified date range
    const reservations = await Reservation.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('user_id', 'name email')
      .populate('table_id', 'table_number capacity')
      .sort({ date: 1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
