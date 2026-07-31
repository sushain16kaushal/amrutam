import 'dotenv/config';
import pg from 'pg';
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

const pool = new pg.Pool({ connectionString: env.databaseUrl });

const run = async () => {
  // NEW — public /register no longer accepts role:'admin' (security fix — anyone could
  // previously self-register as admin). Register as 'patient' (the only safe public
  // option), then upgrade the role directly via DB, same trusted-script pattern used
  // in seed-ai-doctors.js to mark doctor_kind:'ai'.
  const registerRes = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'patient',
      country: 'IN',
      city: 'Delhi'
    })
  });
  const registerData = await registerRes.json();

  if (registerData.success) {
    console.log('✅ Account created:', registerData.data);
  } else if (registerData.message?.includes('already registered')) {
    console.log('ℹ️  Account already exists — skipping registration.');
  } else {
    console.error('❌ Registration failed:', registerData.message);
    await pool.end();
    process.exit(1);
  }

  const upgradeResult = await pool.query(
    `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role`,
    [ADMIN_EMAIL]
  );
  if (upgradeResult.rowCount === 0) {
    console.error('❌ Could not find user to upgrade to admin — something went wrong.');
    await pool.end();
    process.exit(1);
  }
  console.log('✅ Upgraded to admin role via DB:', upgradeResult.rows[0]);
  await pool.end();

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