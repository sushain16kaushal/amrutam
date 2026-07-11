import speakeasy from 'speakeasy';

const BASE_URL = 'http://localhost:5000/api/auth';
const TEST_EMAIL = `test_${Date.now()}@amrutam.com`; // har run pe unique email
const TEST_PASSWORD = 'Test@1234';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const run = async () => {
  // 1. Register
  const registerRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'patient' })
  });
  const registerData = await registerRes.json();
  log('1. Register', registerData);
  if (!registerData.success) return console.error('Register failed, stopping.');

  // 2. Login (MFA still disabled at this point)
  const login1Res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const login1Data = await login1Res.json();
  log('2. Login (before MFA)', login1Data);
  const firstAccessToken = login1Data.data.accessToken;

  // 3. Enable MFA
  const enableMfaRes = await fetch(`${BASE_URL}/enable-mfa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firstAccessToken}`
    }
  });
  const enableMfaData = await enableMfaRes.json();
  log('3. Enable MFA', enableMfaData);

  // Extract the base32 secret from the otpauth URL
  const otpauthUrl = enableMfaData.data.otpauthUrl;
  const secret = new URL(otpauthUrl).searchParams.get('secret');
  console.log('Extracted secret:', secret);

  // 4. Login again (MFA now required)
  const login2Res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const login2Data = await login2Res.json();
  log('4. Login (MFA required)', login2Data);
  const tempToken = login2Data.data.tempToken;

  // 5. Generate the current OTP ourselves (same as an authenticator app would show)
  const otpCode = speakeasy.totp({ secret, encoding: 'base32' });
  console.log('Generated OTP:', otpCode);

  // 6. Verify MFA
  const verifyRes = await fetch(`${BASE_URL}/verify-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otpCode })
  });
  const verifyData = await verifyRes.json();
  log('5. Verify MFA (final login)', verifyData);

  if (verifyData.success) {
    console.log('\n✅ FULL AUTH FLOW WORKING END TO END');
  } else {
    console.log('\n❌ Something failed — check the step above');
  }
    // 7. Check profile was auto-created
  const profileRes = await fetch(`${BASE_URL.replace('/auth', '/users')}/me`, {
    headers: { Authorization: `Bearer ${verifyData.data.accessToken}` }
  });
  const profileData = await profileRes.json();
  log('6. Get profile (auto-created on register)', profileData);

  // 8. RBAC test — patient should get 403 on admin-only route
  const rbacTestRes = await fetch(`${BASE_URL.replace('/auth', '/users')}/admin-only-test`, {
    headers: { Authorization: `Bearer ${verifyData.data.accessToken}` }
  });
  const rbacData = await rbacTestRes.json();
  log('7. RBAC test (expect 403 - patient has no user:manage permission)', rbacData);
};


run().catch(console.error);