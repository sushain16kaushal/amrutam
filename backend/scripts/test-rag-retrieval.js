// backend/scripts/test-rag-retrieval.js
//
// Usage:
//   node scripts/test-rag-retrieval.js
//   node scripts/test-rag-retrieval.js <consultation-id>
//   node scripts/test-rag-retrieval.js <consultation-id> "custom test message"
//
// Agar consultation-id nahi diya, script khud DB se koi bhi AI-doctor consultation
// dhoond leta hai (test convenience ke liye — real pipeline mein consultation-id
// hamesha caller se aayega, chat-session context se).

import pool from '../src/config/db.js';
import { getSpecialtyForConsultation, retrieveRelevantChunks } from '../src/modules/ai-agents/ragRetrieval.service.js';

const DEFAULT_TEST_MESSAGES = [
  // In-specialty (Cardiology) — varying phrasing, kuch direct kuch indirect
  'I have chest pain sometimes, should I be worried?',
  'My heart feels like it skips a beat randomly',
  'Doctor mera blood pressure bahot high aa raha hai',
  'What foods should I avoid for my cholesterol?',
  'I get breathless climbing stairs, is that a heart problem?',

  // Out-of-specialty — clearly different domains
  'My skin has been really itchy and red lately',
  'My child has had a fever for two days',
  'What is the capital of France?',
  'Can you help me write a poem?'
];

const findAnyAiConsultationId = async () => {
  const result = await pool.query(
    `SELECT c.id
     FROM consultations c
     JOIN availability_slots s ON s.id = c.slot_id
     JOIN doctors d ON d.id = s.doctor_id
     WHERE d.doctor_kind = 'ai'
     LIMIT 1`
  );
  return result.rows[0]?.id || null;
};

const run = async () => {
  const argConsultationId = process.argv[2];
  const argMessage = process.argv[3];

  const consultationId = argConsultationId || (await findAnyAiConsultationId());

  if (!consultationId) {
    console.error(
      'No AI-doctor consultation found in DB, aur koi consultation-id bhi nahi diya gaya.\n' +
      'Pehle ek AI doctor ke saath consultation book karo, ya consultation-id CLI arg mein pass karo.'
    );
    await pool.end();
    process.exit(1);
  }

  console.log(`Using consultation_id: ${consultationId}`);

  const specialty = await getSpecialtyForConsultation(consultationId);
  console.log(`Resolved specialty: ${specialty}\n`);

  const messages = argMessage ? [argMessage] : DEFAULT_TEST_MESSAGES;

  for (const message of messages) {
    console.log(`--- Query: "${message}" ---`);
    const chunks = await retrieveRelevantChunks({ specialty, message, topK: 3 });

    if (chunks.length === 0) {
      console.log('  No chunks found (specialty ke liye knowledge base khaali ho sakta hai).\n');
      continue;
    }

    chunks.forEach((chunk, i) => {
      console.log(
        `  ${i + 1}. [${chunk.similarity.toFixed(4)}] ${chunk.topic} (${chunk.specialty})`
      );
    });
    console.log('');
  }

  await pool.end();
};

run().catch(async (err) => {
  console.error('Test script failed:', err);
  await pool.end();
  process.exit(1);
});
