import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

let mongod;

// Connect to the in-memory database before running tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Mock modules
jest.unstable_mockModule('cookie-parser', () => ({
  default: () => (req, res, next) => {
    req.cookies = {};
    next();
  }
}));

// Global test utilities
global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockRequest = (overrides = {}) => ({
  cookies: {},
  body: {},
  params: {},
  query: {},
  ...overrides
});