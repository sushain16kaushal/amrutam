import pg from 'pg';
import { env } from '../src/config/env.js';

const AUTH = 'http://localhost:5000/api/auth';
const DOC = 'http://localhost:5000/api/doctors';

const pool = new pg.Pool({ connectionString: env.databaseUrl });

const doctorsData = [
  ['Ramesh Sharma', 'Cardiology'], ['Anjali Mehta', 'Cardiology'], ['Vikram Rathore', 'Cardiology'],
  ['Priya Nair', 'Dermatology'], ['Suresh Verma', 'Dermatology'], ['Kavita Iyer', 'Dermatology'],
  ['Arjun Malhotra', 'Pediatrics'], ['Neha Kapoor', 'Pediatrics'], ['Rohan Desai', 'Pediatrics'],
  ['Sunita Rao', 'Orthopedics'], ['Manish Gupta', 'Orthopedics'], ['Divya Menon', 'Orthopedics'],
  ['Ajay Bhatt', 'Gynecology'], ['Pooja Chawla', 'Gynecology'], ['Rakesh Joshi', 'Gynecology'],
  ['Meera Pillai', 'ENT'], ['Sanjay Kulkarni', 'ENT'], ['Ritu Bansal', 'ENT'],
  ['Deepak Agarwal', 'Neurology'], ['Shalini Reddy', 'Neurology'], ['Karan Singh', 'Neurology'],
  ['Anita Das', 'Psychiatry'], ['Vivek Choudhary', 'Psychiatry'], ['Nisha Trivedi', 'Psychiatry'],
  ['Ramesh Yadav', 'General Medicine'], ['Swati Bhatia', 'General Medicine'], ['Amit Shukla', 'General Medicine'],
  ['Geeta Krishnan', 'Ophthalmology'], ['Harish Pandey', 'Ophthalmology'], ['Lakshmi Subramaniam', 'Ophthalmology'],
  ['Nikhil Saxena', 'Cardiology'], ['Farah Khan', 'Dermatology'], ['Gaurav Mishra', 'Pediatrics'],
  ['Radhika Nambiar', 'Orthopedics'], ['Tarun Chopra', 'Gynecology'], ['Simran Kaur', 'ENT'],
  ['Aditya Ranganathan', 'Neurology'], ['Preeti Sinha', 'Psychiatry'], ['Vishal Thakur', 'General Medicine'],
  ['Aarti Bose', 'Ophthalmology'], ['Sameer Dutta', 'Cardiology'], ['Ishita Ghosh', 'Dermatology'],
  ['Rahul Nair', 'Pediatrics'], ['Komal Arora', 'Orthopedics'], ['Yash Vora', 'Gynecology'],
  ['Tanvi Solanki', 'ENT'], ['Abhishek Rana', 'Neurology'], ['Sneha Warrier', 'Psychiatry']
];

const POSSIBLE_HOURS = [9, 10, 11, 14, 15, 16, 17]; // realistic clinic hours

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const registerDoctor = async (fullName, specialty, index) => {
  const email = `doctor${index}_${Date.now()}@amrutam.com`;

  const registerRes = await fetch(`${AUTH}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234', role: 'doctor' })
  });
  const registerData = await registerRes.json();
  if (!registerData?.success) {
    throw new Error(`Register failed for doctor ${index} (${fullName}): ${JSON.stringify(registerData)}`);
  }

  const loginRes = await fetch(`${AUTH}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test@1234' })
  });
  const loginData = await loginRes.json();
  if (!loginData?.data?.accessToken) {
    throw new Error(`Login failed for doctor ${index} (${fullName}): ${JSON.stringify(loginData)}`);
  }

  const token = loginData.data.accessToken;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  await fetch(`${AUTH.replace('/auth', '/users')}/me`, {
    method: 'PATCH', headers, body: JSON.stringify({ fullName })
  });
  await fetch(`${DOC}/register`, { method: 'POST', headers, body: JSON.stringify({ specialty }) });

  const numSlots = 4 + Math.floor(Math.random() * 3); // 4 to 6 slots
  for (let i = 0; i < numSlots; i++) {
    const daysAhead = 1 + Math.floor(Math.random() * 5);
    const hour = POSSIBLE_HOURS[Math.floor(Math.random() * POSSIBLE_HOURS.length)];
    const minute = Math.random() < 0.5 ? 0 : 30;

    const start = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    await fetch(`${DOC}/availability`, {
      method: 'POST', headers,
      body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString(), capacity: 3 + Math.floor(Math.random() * 3) })
    });
  }
};

const run = async () => {
  console.log(`Seeding ${doctorsData.length} doctors...`);
  for (let i = 0; i < doctorsData.length; i++) {
    const [name, specialty] = doctorsData[i];
    try {
      await registerDoctor(name, specialty, i);
      process.stdout.write(`\r${i + 1}/${doctorsData.length} done`);
    } catch (err) {
      console.error(`\nFailed on doctor ${i} (${name}):`, err.message);
      console.log('Waiting 3s before continuing...');
      await sleep(3000); // agar rate-limited hua, thoda lamba ruk ke recover hone do
    }
    await sleep(300); // rate limiter se bachne ke liye har doctor ke baad chhota gap
  }
  console.log('\nVerifying all doctors...');
  await pool.query(`UPDATE doctors SET verified = true`);
  console.log('Done! All doctors registered, profiled, sloted, and verified.');
  await pool.end();
};

run().catch(console.error);