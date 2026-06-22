const request = require('supertest');

const BASE = 'http://localhost:5002';

describe('Integration tests - server', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(BASE).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  }, 20000);
});
