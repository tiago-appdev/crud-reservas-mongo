import {
  createReservation,
  getAllReservations,
  getUserReservations,
  deleteReservation
} from '../../controllers/api/reservation.controllers.js';
import Reservation from '../../models/Reservation.js';
import Table from '../../models/Table.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock request and response
// eslint-disable-next-line no-unused-vars
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Reservation Controller Tests', () => {
  let mockReq;
  let mockRes;
  let testTable;
  let testUser;

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    // Limpia las colecciones para evitar datos residuales
    await User.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});

    // Crea un usuario de prueba
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'client'
    });

    // Crea una mesa de prueba
    testTable = await Table.create({
      table_number: 1,
      capacity: 4,
      available: true,
      reservations: []
    });

    // Configura el mock de la solicitud y respuesta
    mockReq = {
      user: { _id: testUser._id },
      body: {
        table_id: testTable._id.toString(),
        date: '2024-12-25',
        time: '18:00',
        guests: 2
      }
    };
    mockRes = mockResponse();
  });

  afterEach(async () => {
    // Limpia las colecciones
    await User.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
  });

  describe('createReservation', () => {
    beforeEach(() => {
      mockReq = {
        user: testUser,
        body: {
          table_id: testTable._id,
          date: '2024-12-25',
          time: '18:00',
          guests: 2
        }
      };
    });

    it('should create a new reservation successfully', async () => {
      await createReservation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();

      const reservation = await Reservation.findOne({
        user_id: testUser._id
      });
      expect(reservation).toBeTruthy();
      expect(reservation.guests).toBe(2);
    });

    it('should fail if table capacity is insufficient', async () => {
      mockReq.body.guests = 10;

      await createReservation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Table not available or insufficient capacity'
      });
    });
  });

  describe('getAllReservations', () => {
    it('should return all reservations', async () => {
      // Create test reservations
      await Reservation.create([
        {
          user_id: testUser._id,
          table_id: testTable._id,
          date: new Date('2024-12-25 18:00'),
          guests: 2
        },
        {
          user_id: testUser._id,
          table_id: testTable._id,
          date: new Date('2024-12-26 19:00'),
          guests: 3
        }
      ]);

      await getAllReservations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const reservations = mockRes.json.mock.calls[0][0];
      expect(reservations).toHaveLength(2);
    });
  });

  describe('getUserReservations', () => {
    beforeEach(() => {
      mockReq = { user: testUser };
    });

    it('should return user specific reservations', async () => {
      // Create test reservations for the user
      await Reservation.create({
        user_id: testUser._id,
        table_id: testTable._id,
        date: new Date('2024-12-25 18:00'),
        guests: 2
      });

      await getUserReservations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const reservations = mockRes.json.mock.calls[0][0];
      expect(reservations).toHaveLength(1);
      expect(reservations[0].user_id.toString()).toBe(testUser._id.toString());
    });
  });

  describe('deleteReservation', () => {
    let testReservation;

    beforeEach(async () => {
      testReservation = await Reservation.create({
        user_id: testUser._id,
        table_id: testTable._id,
        date: new Date('2024-12-25 18:00'),
        guests: 2
      });

      mockReq = {
        user: testUser,
        params: { id: testReservation._id }
      };
    });

    it('should delete reservation successfully', async () => {
      await deleteReservation(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Reservation deleted successfully'
      });

      const deletedReservation = await Reservation.findById(
        testReservation._id
      );
      expect(deletedReservation).toBeNull();
    });

    it('should not allow unauthorized deletion', async () => {
      mockReq.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'client'
      };

      await deleteReservation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized to delete this reservation'
      });
    });
  });
});
