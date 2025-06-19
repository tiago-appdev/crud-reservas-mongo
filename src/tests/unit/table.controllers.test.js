import {
  createTable,
  getAllTables,
  getTable,
  updateTable,
  deleteTable,
  getAvailableTables
} from '../../controllers/api/table.controllers.js';
import Table from '../../models/Table.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Table Controller Tests', () => {
  let mockReq;
  let mockRes;
  let adminUser;
  let testTable;

  beforeAll(async () => {
    adminUser = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
  });

  beforeEach(async () => {
    mockRes = mockResponse();
    testTable = await Table.create({
      table_number: 1,
      capacity: 4,
      available: true
    });
  });

  afterEach(async () => {
    await Table.deleteMany();
  });

  describe('createTable', () => {
    beforeEach(() => {
      mockReq = {
        user: adminUser,
        body: {
          table_number: 2,
          capacity: 6
        }
      };
    });

    it('should create a new table successfully', async () => {
      await createTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();

      const table = await Table.findOne({ table_number: 2 });
      expect(table).toBeTruthy();
      expect(table.capacity).toBe(6);
    });

    it('should fail if table already exists', async () => {
      mockReq.body.table_number = 1;

      await createTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Table with the same number already exists'
      });
    });

    it('should fail if user is not an admin', async () => {
      mockReq.user.role = 'client';

      await createTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Only admins can create tables'
      });
    });
  });

  describe('getAllTables', () => {
    it('should return all tables', async () => {
      await getAllTables(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const tables = mockRes.json.mock.calls[0][0];
      expect(tables).toHaveLength(1);
      expect(tables[0].table_number).toBe(1);
    });
  });

  describe('getTable', () => {
    it('should return a specific table by ID', async () => {
      mockReq = { params: { id: testTable._id } };

      await getTable(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const table = mockRes.json.mock.calls[0][0];
      expect(table.table_number).toBe(1);
    });

    it('should return 404 if table is not found', async () => {
      mockReq = { params: { id: new mongoose.Types.ObjectId() } };

      await getTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Table not found'
      });
    });
  });

  describe('updateTable', () => {
    beforeEach(() => {
      mockReq = {
        user: adminUser,
        params: { id: testTable._id },
        body: { capacity: 8 }
      };
    });

    it('should update an existing table', async () => {
      adminUser.role = 'admin';
      await updateTable(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const updatedTable = await Table.findById(testTable._id);
      expect(updatedTable.capacity).toBe(8);
    });

    it('should return 404 if table is not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId();

      await updateTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Table not found'
      });
    });

    it('should fail if user is not an admin', async () => {
      mockReq.user.role = 'client';

      await updateTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Only admins can update tables'
      });
    });
  });

  describe('deleteTable', () => {
    beforeEach(() => {
      mockReq = {
        user: adminUser,
        params: { id: testTable._id }
      };
    });

    it('should delete a table successfully', async () => {
      mockReq.user.role = 'admin';
      await deleteTable(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Table deleted successfully'
      });

      const deletedTable = await Table.findById(testTable._id);
      expect(deletedTable).toBeNull();
    });

    it('should fail if user is not an admin', async () => {
      mockReq.user.role = 'client';

      await deleteTable(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Only admins can delete tables'
      });
    });
  });

  describe('getAvailableTables', () => {
    it('should return available tables for a given date and time', async () => {
      mockReq = {
        query: { date: '2024-12-25', time: '18:00', party_size: 2 }
      };

      await getAvailableTables(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const availableTables = mockRes.json.mock.calls[0][0];
      expect(availableTables).toHaveLength(1);
      expect(availableTables[0].table_number).toBe(1);
    });

    it('should return 400 if query parameters are missing', async () => {
      mockReq = { query: { date: '2024-12-25' } };

      await getAvailableTables(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Missing required query parameters'
      });
    });
  });
});
