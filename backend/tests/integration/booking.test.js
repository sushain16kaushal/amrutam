import request from 'supertest';
import app from '../../src/app.js';
import crypto from 'crypto';

const registerAndLogin = async (role) => {
  const email = `jest_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await request(app).post('/api/auth/register').send({ email, password: 'Test@1234', role });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'Test@1234' });
  return loginRes.body.data.accessToken;
};

describe('Booking flow — idempotency, concurrency, saga', () => {
  let doctorToken, patientToken, slotId;

  beforeAll(async () => {
    doctorToken = await registerAndLogin('doctor');
    await request(app)
      .post('/api/doctors/register')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ specialty: 'Cardiology' });

    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const slotRes = await request(app)
      .post('/api/doctors/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ startTime: startTime.toISOString(), endTime: endTime.toISOString() });
    slotId = slotRes.body.data.id;

    patientToken = await registerAndLogin('patient');
  });

  test('rejects booking without Idempotency-Key', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ slotId });
    expect(res.status).toBe(400);
  });

  test('creates a booking successfully', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ slotId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('confirmed');
  });

  test('returns identical response on retry with same Idempotency-Key', async () => {
    const key = crypto.randomUUID();
    const first = await request(app)
      .post('/api/doctors/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString()
      });
    const newSlotId = first.body.data.id;

    const res1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', key)
      .send({ slotId: newSlotId });

    const res2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${patientToken}`)
      .set('Idempotency-Key', key)
      .send({ slotId: newSlotId });

    expect(res1.body.data.id).toBe(res2.body.data.id);
  });

  test('rejects booking an already-booked slot', async () => {
    const otherPatientToken = await registerAndLogin('patient');
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ slotId }); // already booked in the earlier test
    expect(res.status).toBe(409);
  });
});