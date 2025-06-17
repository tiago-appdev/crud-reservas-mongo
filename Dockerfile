# Multi-stage build for production optimization
FROM node:22-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory and user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /usr/src/app

# Change ownership of the work directory to nodejs user
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Development stage
FROM base AS development

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
CMD ["dumb-init", "npm", "run", "dev"]

# Production dependencies stage
FROM base AS dependencies

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Production build stage
FROM base AS build

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY --chown=nodejs:nodejs . .

# Run any build processes (linting, tests, etc.)
RUN npm run lint:check

# Production stage
FROM base AS production

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copy application code
COPY --from=build --chown=nodejs:nodejs /usr/src/app .

# Remove unnecessary files
RUN rm -rf scripts/seed.js tests/ *.test.js *.spec.js coverage/ .babelrc

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { hostname: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
               const req = http.request(options, (res) => { \
                 if (res.statusCode === 200) process.exit(0); \
                 else process.exit(1); \
               }); \
               req.on('timeout', () => process.exit(1)); \
               req.on('error', () => process.exit(1)); \
               req.end();"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly and run the application
CMD ["dumb-init", "npm", "start"]