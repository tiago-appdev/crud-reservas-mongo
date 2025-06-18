import { Router } from 'express';
import mongoose from 'mongoose';
import { register } from '../services/metrics.js';

const router = Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * Basic health check endpoint
 * @route GET /health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check with dependencies
 * @route GET /health/detailed
 */
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.status = 'ERROR';
    }
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'ERROR';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal / 1024 / 1024; // Convert to MB
  const usedMemory = memoryUsage.heapUsed / 1024 / 1024; // Convert to MB
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  health.checks.memory = {
    used: `${usedMemory.toFixed(2)} MB`,
    total: `${totalMemory.toFixed(2)} MB`,
    usage: `${memoryUsagePercent.toFixed(2)}%`,
    status: memoryUsagePercent > 90 ? 'warning' : 'ok'
  };

  if (memoryUsagePercent > 95) {
    health.status = 'WARNING';
  }

  const statusCode = health.status === 'OK' ? 200 : 
    health.status === 'WARNING' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * Readiness probe for Kubernetes/Docker
 * @route GET /ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'NOT_READY',
        reason: 'Database not connected'
      });
    }

    // Perform a simple database operation
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      reason: 'Database connectivity issue',
      error: error.message
    });
  }
});

/**
 * Liveness probe for Kubernetes/Docker
 * @route GET /live
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;