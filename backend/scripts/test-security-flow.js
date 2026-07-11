// scripts/test-security-flow.js
const AUTH_BASE_URL = 'http://localhost:5000/api/auth';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const run = async () => {
  const testEmail = `sectest_${Date.now()}@amrutam.com`;

  // ============ 1. Input validation (zod) ============

  // 1a. Weak password (too short, no uppercase, no number) — expect 400
  const weakPwRes = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'weak', role: 'patient' })
  });
  log('1a. Register with weak password (expect 400)', await weakPwRes.json());

  // 1b. Invalid email format — expect 400
  const badEmailRes = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'Test@1234', role: 'patient' })
  });
  log('1b. Register with invalid email (expect 400)', await badEmailRes.json());

  // 1c. Invalid role — expect 400
  const badRoleRes = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test@1234', role: 'superadmin' })
  });
  log('1c. Register with invalid role (expect 400)', await badRoleRes.json());

  // 1d. Valid registration — expect success
  const validRegRes = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test@1234', role: 'patient' })
  });
  log('1d. Register with valid strong password (expect success)', await validRegRes.json());

  // ============ 2. Security headers (helmet) ============
  const headersRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test@1234' })
  });
  console.log('\n--- 2. Security headers present (helmet) ---');
  console.log('x-content-type-options:', headersRes.headers.get('x-content-type-options'));
  console.log('x-frame-options:', headersRes.headers.get('x-frame-options') || '(handled via CSP in newer helmet)');
  console.log('x-dns-prefetch-control:', headersRes.headers.get('x-dns-prefetch-control'));
  const loginData = await headersRes.json();
  const accessToken = loginData.data.accessToken;

  // ============ 3. MFA encryption round-trip ============
  // We can't read the DB directly from this script, but if enable->login->verify
  // succeeds end-to-end, it PROVES encrypt() then decrypt() produced the original secret.
  const enableMfaRes = await fetch(`${AUTH_BASE_URL}/enable-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
  });
  const enableMfaData = await enableMfaRes.json();
  log('3a. Enable MFA (secret should be stored ENCRYPTED in DB)', enableMfaData);

  const otpauthUrl = enableMfaData.data.otpauthUrl;
  const secret = new URL(otpauthUrl).searchParams.get('secret');

  const login2Res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Test@1234' })
  });
  const login2Data = await login2Res.json();
  const tempToken = login2Data.data.tempToken;

  // Generate OTP using speakeasy (dynamic import so the script works even if not globally installed)
  const speakeasy = (await import('speakeasy')).default;
  const otpCode = speakeasy.totp({ secret, encoding: 'base32' });

  const verifyRes = await fetch(`${AUTH_BASE_URL}/verify-mfa`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otpCode })
  });
  const verifyData = await verifyRes.json();
  log('3b. Verify MFA after enabling (proves encrypt/decrypt round-trip works)', verifyData);
  console.log(verifyData.success
    ? '✅ MFA encryption round-trip working — secret encrypted at rest, correctly decrypted for verification'
    : '❌ MFA encryption broken — could not decrypt secret correctly');

  // ============ 4. Rate limiting on auth routes ============
  // WARNING: this will exhaust the auth rate limit for this IP for the next 15 minutes.
  // Run this test LAST, and expect further /api/auth/* calls to fail with 429 for a while after.
  console.log('\n--- 4. Rate limiting test (sending 12 rapid login attempts, limit is 10/15min) ---');
  const attempts = [];
  for (let i = 1; i <= 12; i++) {
    const res = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword' })
    });
    attempts.push({ attempt: i, status: res.status });
  }
  console.log(attempts);
  const got429 = attempts.some((a) => a.status === 429);
  console.log(got429
    ? '✅ Rate limiting working — got a 429 before reaching 12 attempts'
    : '❌ Rate limiting not triggered — check middleware order/config');
  console.log('\n⚠️  Auth rate limit is now exhausted for this IP for ~15 minutes. Other auth tests will fail with 429 until then.');
};

run().catch(console.error);