// scripts/test-analytics-flow.js
const AUTH_BASE_URL = 'http://localhost:5000/api/auth';
const ANALYTICS_BASE_URL = 'http://localhost:5000/api/analytics';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const registerAndLogin = async (role) => {
  const email = `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234', role })
  });
  const loginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234' })
  });
  const token = (await loginRes.json()).data.accessToken;
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const run = async () => {
  const adminHeaders = await registerAndLogin('admin');
  const patientHeaders = await registerAndLogin('patient');

  // 1. Patient tries analytics — expect 403
  const patientTryRes = await fetch(`${ANALYTICS_BASE_URL}/overview`, { headers: patientHeaders });
  log('1. Patient tries analytics overview (expect 403)', await patientTryRes.json());

  // 2. Admin — overview (uses real data accumulated from all previous test runs)
  const overviewRes = await fetch(`${ANALYTICS_BASE_URL}/overview`, { headers: adminHeaders });
  log('2. Admin — overview', await overviewRes.json());

  // 3. Admin — consultations by day
  const byDayRes = await fetch(`${ANALYTICS_BASE_URL}/consultations-by-day?days=7`, { headers: adminHeaders });
  log('3. Admin — consultations by day (last 7 days)', await byDayRes.json());

  // 4. Admin — top specialties
  const topSpecialtiesRes = await fetch(`${ANALYTICS_BASE_URL}/top-specialties`, { headers: adminHeaders });
  log('4. Admin — top specialties', await topSpecialtiesRes.json());

  // 5. Admin — cancellation rate
  const cancellationRes = await fetch(`${ANALYTICS_BASE_URL}/cancellation-rate`, { headers: adminHeaders });
  log('5. Admin — cancellation rate', await cancellationRes.json());

  // 6. Verify caching — call overview again immediately, response should be identical (served from Redis)
  const overviewRes2 = await fetch(`${ANALYTICS_BASE_URL}/overview`, { headers: adminHeaders });
  const overviewData2 = await overviewRes2.json();
  log('6. Admin — overview again (expect identical, served from cache)', overviewData2);
};

run().catch(console.error);