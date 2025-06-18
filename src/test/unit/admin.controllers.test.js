import {
  getAdminDashboard,
  getOccupancyReport,
  bulkUpdateTableAvailability
} from '../../controllers/api/admin.controllers.js';
import Reservation from '../../models/Reservation.js';
import Table from '../../models/Table.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock request and response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin Controller Tests', () => {
  let mockReq;
  let mockRes;
  let testAdmin;
  let testTable;

  beforeEach(async () => {
    mockRes = mockResponse();

    // Create a test admin user
    testAdmin = { _id: new mongoose.Types.ObjectId(), role: 'admin' };

    // Create a test table
    testTable = await Table.create({
      table_number: 1,
      capacity: 4,
      available: true
    });

    // Create a test reservation
    await Reservation.create({
      user_id: testAdmin._id,
      table_id: testTable._id,
      date: new Date('2024-12-25 18:00'),
      guests: 2
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard data', async () => {
      mockReq = { user: testAdmin };

      await getAdminDashboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const dashboardData = mockRes.json.mock.calls[0][0];
      expect(dashboardData).toHaveProperty('totalTables');
      expect(dashboardData).toHaveProperty('totalReservations');
      expect(dashboardData).toHaveProperty('availableTables');
      expect(dashboardData).toHaveProperty('todayReservations');
    });

    it('should return 403 if user is not admin', async () => {
      mockReq = { user: { role: 'client' } };

      await getAdminDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied'
      });
    });
  });

  describe('getOccupancyReport', () => {
    it('should return occupancy data for a given date range', async () => {
      mockReq = {
        user: testAdmin,
        query: { startDate: '2024-12-25', endDate: '2024-12-26' }
      };

      await getOccupancyReport(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const occupancyData = mockRes.json.mock.calls[0][0];
      expect(occupancyData).toHaveProperty('2024-12-25');
    });

    it('should return 403 if user is not admin', async () => {
      mockReq = {
        user: { role: 'client' },
        query: { startDate: '2024-12-25', endDate: '2024-12-26' }
      };

      await getOccupancyReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied'
      });
    });
  });

  describe('bulkUpdateTableAvailability', () => {
    it('should update table availability successfully', async () => {
      mockReq = {
        user: testAdmin,
        body: { tableIds: [testTable._id], available: false }
      };

      await bulkUpdateTableAvailability(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Tables updated successfully',
        modifiedCount: 1
      });

      const updatedTable = await Table.findById(testTable._id);
      expect(updatedTable.available).toBe(false);
    });

    it('should return 403 if user is not admin', async () => {
      mockReq = {
        user: { role: 'client' },
        body: { tableIds: [testTable._id], available: false }
      };

      await bulkUpdateTableAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied'
      });
    });
  });
});
