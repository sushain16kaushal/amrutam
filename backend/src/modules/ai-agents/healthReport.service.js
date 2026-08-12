// naya file: backend/src/modules/ai-agents/healthReport.service.js
import { generateStructuredJson } from './llmClient.service.js';

const buildReportPrompt = ({ chatHistory, specialty, safetyFlags, matchedFlag, reason }) => `
Patient consultation transcript (specialty: ${specialty}):
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Escalation trigger: ${reason} (flag: ${matchedFlag})

Summarize this into a structured patient health report. Do NOT diagnose or suggest treatment.
Respond as JSON: { "chiefComplaint": "...", "symptomsSummary": "...", "duration": "...",
"specialty": "...", "recommendedAction": "consult a specialist within X days" }
`;

export const generateHealthReport = async ({ chatHistory, specialty, safetyFlags, matchedFlag, reason }) => {
  const prompt = buildReportPrompt({ chatHistory, specialty, safetyFlags, matchedFlag, reason });
  return generateStructuredJson({ 
    system: 'You are a medical intake summarizer. No diagnosis, no treatment advice.', 
    prompt 
  });
};