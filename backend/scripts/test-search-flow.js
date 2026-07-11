// test-search-flow.js
const DOCTORS_BASE_URL = 'http://localhost:5000/api/doctors';
const AUTH_BASE_URL = 'http://localhost:5000/api/auth';

const log = (label, data) => {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
};

const registerDoctor = async (specialty, fullName) => {
  const email = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@amrutam.com`;
  await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234', role: 'doctor' })
  });
  const loginRes = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234' })
  });
  const token = (await loginRes.json()).data.accessToken;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const regRes = await fetch(`${DOCTORS_BASE_URL}/register`, { method: 'POST', headers, body: JSON.stringify({ specialty }) });
  console.log('  doctor register:', await regRes.json());

  const profileRes = await fetch(`${AUTH_BASE_URL.replace('/auth', '/users')}/me`, {
    method: 'PATCH', headers, body: JSON.stringify({ fullName })
  });
  console.log('  profile update:', await profileRes.json());

  return { headers };
};

const run = async () => {
  await registerDoctor('Cardiology', 'Ramesh Sharma');
  await registerDoctor('Cardiology', 'Suresh Verma');
  await registerDoctor('Dermatology', 'Priya Nair');

  // NOTE: naye doctors 'verified: false' hain by default, search unhe nahi dikhayega —
  // yeh design mein sahi hai (unverified doctors patients ko nahi dikhne chahiye),
  // lekin test ke liye verify karna padega DB se manually. Uska SQL neeche diya hai.
  console.log('\n⚠️  Doctors are unverified by default. Run this in psql to verify them for testing:');
  console.log(`UPDATE doctors SET verified = true;`);
  console.log('Then re-run this script section below manually, or wait 5s and continue...\n');

  await new Promise((r) => setTimeout(r, 5000));

  const bySpecialty = await fetch(`${DOCTORS_BASE_URL}/search?specialty=cardio`);
  log('1. Search specialty=cardio', await bySpecialty.json());

  const byName = await fetch(`${DOCTORS_BASE_URL}/search?name=Sharma`);
  log('2. Search name=Sharma (exact)', await byName.json());

  const byTypo = await fetch(`${DOCTORS_BASE_URL}/search?name=Shrama`);
  log('3. Search name=Shrama (typo, trigram fuzzy match)', await byTypo.json());

  const paginated = await fetch(`${DOCTORS_BASE_URL}/search?page=1&limit=2`);
  log('4. Paginated (limit=2)', await paginated.json());
};

run().catch(console.error);