import promClient from 'prom-client';

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default Node.js metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics for your app
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeReservations = new promClient.Gauge({
  name: 'active_reservations_total',
  help: 'Number of active reservations'
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeReservations);
register.registerMetric(databaseConnections);

export {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeReservations,
  databaseConnections
};