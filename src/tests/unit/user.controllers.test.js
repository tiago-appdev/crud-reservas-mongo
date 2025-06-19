import {
  createUser,
  loginUser,
  userProfile,
  logoutUser
} from '../../controllers/api/user.controllers.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller Tests', () => {
  let mockReq;
  let mockRes;
  let testUser;

  beforeEach(async () => {
    mockRes = mockResponse();
    // Create a test user for the tests
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'client'
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      mockReq = {
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        }
      };
    });

    it('should create a new user successfully', async () => {
      await createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();

      const newUser = await User.findOne({
        email: 'newuser@example.com'
      });
      expect(newUser).toBeTruthy();
      expect(newUser.email).toBe('newuser@example.com');
    });

    it('should return an error if user already exists', async () => {
      mockReq.body.email = 'testuser@example.com';

      await createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User already exists'
      });
    });
  });

  describe('loginUser', () => {
    beforeEach(() => {
      mockReq = {
        body: {
          email: 'testuser@example.com',
          password: 'password123'
        }
      };
    });

    it('should log in a user successfully', async () => {
      await loginUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();

      const response = mockRes.json.mock.calls[0][0];
      expect(response.message).toBe('Login successful');
      expect(response.role).toBe(testUser.role);
      expect(response.redirectTo).toBe('/reservations'); // O según el rol del usuario
    });

    it('should return an error if credentials are incorrect', async () => {
      mockReq.body.password = 'wrongpassword';

      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });
  });

  describe('userProfile', () => {
    beforeEach(() => {
      mockReq = { user: { _id: testUser._id } };
    });

    it('should return the user profile successfully', async () => {
      await userProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.email).toBe(testUser.email);
    });

    it('should return an error if user is not found', async () => {
      mockReq.user._id = new mongoose.Types.ObjectId(); // Non-existent user ID

      await userProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });

  describe('logoutUser', () => {
    beforeEach(() => {
      mockReq = {};
    });

    it('should log out the user successfully', async () => {
      await logoutUser(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('token', '', {
        maxAge: 0
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged out'
      });
    });
  });
});
