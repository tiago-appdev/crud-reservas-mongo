import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import userApiRoutes from './routes/api/user.routes.js';
import reservationApiRoutes from './routes/api/reservation.routes.js';
import tableApiRoutes from './routes/api/table.routes.js';
import viewRoutes from './routes/view.routes.js';
import adminApiRoutes from './routes/api/admin.routes.js';
import healthRoutes from './routes/health.routes.js';
import dotenv from 'dotenv';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://crud-reservas.onrender.com', process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  })
);

// Logging middleware (conditional for production)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(metricsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Health check routes 
app.use('/', healthRoutes);

// API Routes
app.use('/api/users', userApiRoutes);
app.use('/api/reservations', reservationApiRoutes);
app.use('/api/tables', tableApiRoutes);
app.use('/api/admin', adminApiRoutes);

// View Routes
app.use('/', viewRoutes);

// 404 handler
app.use((req, res) => {
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    res.status(404).json({ message: 'Route not found' });
  } else {
    res.status(404).render('error', {
      title: 'Page Not Found',
      message: 'The page you are looking for does not exist.'
    });
  }
});

// Error handler
app.use((err, req, res) => {
  
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  } else {
    res.status(status).render('error', {
      title: 'Error',
      message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

export default app;