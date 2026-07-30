import pool from '../src/config/db.js';
import { findAiDoctorContextByConsultationId } from '../src/modules/consultations/consultations.repository.js'; // path confirm karna
import { retrieveRelevantChunks } from '../src/modules/ai-agents/ragRetrieval.service.js';
import { assembleLlmRequest } from '../src/modules/ai-agents/promptAssembly.service.js';

const run = async () => {
  const consultationId = process.argv[2];
  const message = process.argv[3] || 'I have chest pain sometimes, should I be worried?';

  if (!consultationId) {
    console.error('Usage: node scripts/test-prompt-assembly.js <consultation-id> ["message"]');
    process.exit(1);
  }

  const context = await findAiDoctorContextByConsultationId(consultationId);
  if (!context) {
    console.error(`Consultation ${consultationId} ke liye AI-doctor context nahi mila.`);
    await pool.end();
    process.exit(1);
  }

  const { specialty, ai_persona_config: personaConfig } = context;
  console.log(`Specialty: ${specialty}`);
  console.log(`Persona: ${personaConfig.display_name}\n`);

  const retrievedChunks = await retrieveRelevantChunks({ specialty, message, topK: 3 });
  console.log('Retrieved chunks:');
  retrievedChunks.forEach((c) => console.log(`  [${c.similarity.toFixed(4)}] ${c.topic}`));

  const llmRequest = assembleLlmRequest({
    personaConfig,
    retrievedChunks,
    chatHistory: [], // abhi khaali — consultation_messages wiring agle step mein
    message
  });

  console.log('\n=== SYSTEM PROMPT ===\n');
  console.log(llmRequest.system);
  console.log('\n=== MESSAGES ===\n');
  console.log(JSON.stringify(llmRequest.messages, null, 2));

  await pool.end();
};

run().catch(async (err) => {
  console.error('Test failed:', err);
  await pool.end();
  process.exit(1);
});
