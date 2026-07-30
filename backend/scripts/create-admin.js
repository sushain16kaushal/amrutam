import 'dotenv/config';
import {env} from '../src/config/env.js';
const AUTH_URL = 'http://localhost:5000/api/auth';

const ADMIN_EMAIL = env.adminEmail;
const ADMIN_PASSWORD = env.adminPassword;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env — add these two lines and re-run:');
  console.error('ADMIN_EMAIL=admin@amrutam.com');
  console.error('ADMIN_PASSWORD=SomeStrong@Pass123');
  process.exit(1);
}

const run = async () => {
  const registerRes = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      country: 'IN',   // NEW — required field ab, admin ke liye location conceptually-irrelevant hai
      city: 'Delhi'    // NEW
    })
  });
  const registerData = await registerRes.json();

  if (registerData.success) {
    console.log('✅ Admin account created:', registerData.data);
  } else if (registerData.message?.includes('already registered')) {
    console.log('ℹ️  Admin already exists — skipping registration, verifying login instead.');
  } else {
    console.error('❌ Registration failed:', registerData.message);
    process.exit(1);
  }

  // Login se confirm karte hain account usable hai
  const loginRes = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();

  if (loginData.success && loginData.data.accessToken) {
    console.log('✅ Admin login verified — ready to use at /admin/login');
  } else {
    console.error('❌ Login check failed:', loginData.message || loginData);
  }
};

run().catch(console.error);