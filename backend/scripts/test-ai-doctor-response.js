import pool from '../src/config/db.js';
import { findAiDoctorContextByConsultationId } from '../src/modules/consultations/consultations.repository.js';
import { retrieveRelevantChunks } from '../src/modules/ai-agents/ragRetrieval.service.js';
import { assembleLlmRequest } from '../src/modules/ai-agents/promptAssembly.service.js';
import { generateAiDoctorResponse } from '../src/modules/ai-agents/llmClient.service.js';

const run = async () => {
  const consultationId = process.argv[2];
  const message = process.argv[3] || 'I have chest pain sometimes, should I be worried?';

  if (!consultationId) {
    console.error('Usage: node scripts/test-ai-doctor-response.js <consultation-id> ["message"]');
    process.exit(1);
  }

  const context = await findAiDoctorContextByConsultationId(consultationId);
  if (!context) {
    console.error(`Consultation ${consultationId} ke liye AI-doctor context nahi mila.`);
    await pool.end();
    process.exit(1);
  }

  const { specialty, ai_persona_config: personaConfig } = context;
  console.log(`Specialty: ${specialty} | Persona: ${personaConfig.display_name}`);
  console.log(`Patient message: "${message}"\n`);

  const retrievedChunks = await retrieveRelevantChunks({ specialty, message, topK: 3 });
  const llmRequest = assembleLlmRequest({ personaConfig, retrievedChunks, chatHistory: [], message });

  console.log('Calling Gemini...\n');
  const response = await generateAiDoctorResponse(llmRequest);

  console.log('=== AI DOCTOR RESPONSE ===\n');
  console.log(response);

  await pool.end();
};

run().catch(async (err) => {
  console.error('Test failed:', err);
  await pool.end();
  process.exit(1);
});