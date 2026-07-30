import request from 'supertest';
import app from '../../src/app.js';

describe('Auth flow', () => {
  const email = `jest_${Date.now()}@amrutam.com`;
  const password = 'Test@1234';

  test('rejects weak password on register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'weak', role: 'patient' });
    expect(res.status).toBe(400);
  });

  test('registers a user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, role: 'patient', country: 'IN', city: 'Gurugram' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, role: 'patient', country: 'IN', city: 'Gurugram' });
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });
});