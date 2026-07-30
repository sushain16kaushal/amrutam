// backend/scripts/seed-test-consultation.js
//
// Usage: node scripts/seed-test-consultation.js
//
// Sirf testing ke liye — real booking flow (payment, capacity-check, transaction lock)
// bypass karta hai. Ek open AI-doctor slot + koi existing patient user leke seedha
// consultation row bana deta hai, status 'pending'. Isse aage payment/booking-flow
// validate NAHI hota — sirf RAG retrieval test karne ke liye consultation-id chahiye tha.

import pool from '../src/config/db.js';
import { createConsultation } from '../src/modules/bookings/bookings.repository.js'; // path apne structure ke hisaab se confirm karna

const findOpenAiSlot = async (specialty) => {
  const result = await pool.query(
    `SELECT s.id AS slot_id, d.specialty
     FROM availability_slots s
     JOIN doctors d ON d.id = s.doctor_id
     WHERE d.doctor_kind = 'ai' AND s.status = 'open'
       AND ($1::text IS NULL OR d.specialty = $1)
     ORDER BY s.start_time ASC
     LIMIT 1`,
    [specialty || null]
  );
  return result.rows[0] || null;
};

const findAnyPatient = async () => {
  const result = await pool.query(
    `SELECT id FROM users WHERE role = 'patient' LIMIT 1` // role-naming confirm karna, doctors.repository.js pattern se match kiya
  );
  return result.rows[0]?.id || null;
};

const run = async () => {
  const requestedSpecialty = process.argv[2]; // optional — jaise "Orthopedics", "Neurology"

  const slot = await findOpenAiSlot(requestedSpecialty);
  if (!slot) {
    console.error(
      requestedSpecialty
        ? `Koi open AI-doctor slot nahi mila specialty "${requestedSpecialty}" ke liye. Specialty-naam DB mein jaisa hai waisa hi (case-sensitive) daalo.`
        : 'Koi open AI-doctor slot nahi mila. Slot Manager job chal chuka hai confirm karo (350 slots).'
    );
    await pool.end();
    process.exit(1);
  }

  const patientId = await findAnyPatient();
  if (!patientId) {
    console.error('Koi patient user nahi mila DB mein. Pehle ek patient signup karo (ya bata do role-column ka actual naam kya hai).');
    await pool.end();
    process.exit(1);
  }

  // createConsultation ek `client` expect karta hai (transaction ke andar use hota hai
  // real booking-flow mein) — yahan koi transaction nahi chahiye, pool khud .query()
  // implement karta hai toh interface match ho jaata hai
  const consultation = await createConsultation(pool, { slotId: slot.slot_id, patientId });

  console.log('Test consultation created:');
  console.log(`  consultation_id: ${consultation.id}`);
  console.log(`  specialty: ${slot.specialty}`);
  console.log(`  status: ${consultation.status}`);
  console.log(`\nAb test karo: node scripts/test-rag-retrieval.js ${consultation.id}`);

  await pool.end();
};

run().catch(async (err) => {
  console.error('Seed-test-consultation failed:', err);
  await pool.end();
  process.exit(1);
});