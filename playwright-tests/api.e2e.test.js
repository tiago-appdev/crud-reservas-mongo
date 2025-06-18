import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('OK');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  test('should respond to detailed health check', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health/detailed');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('OK');
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('memory');
  });

  test('should respond to readiness probe', async ({ request }) => {
    const response = await request.get('http://localhost:3000/ready');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('READY');
  });
});