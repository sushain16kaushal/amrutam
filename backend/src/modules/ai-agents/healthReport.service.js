// backend/modules/ai-agents/healthReport.service.js
import { generateStructuredJson } from './llmClient.service.js';

// NOTE: generateStructuredJson() ka error-fallback escalation-shape ka hai
// ({ escalate: false, reason: null, severity: null }) — humare report-shape se
// match nahi karta. Isliye yahan result ko defensively validate kar rahe hain aur
// missing/malformed shape ke liye apna safe default de rahe hain, taaki DB mein
// kabhi galat-shape wala report save na ho.

const buildReportPrompt = ({ chatHistory, specialty }) => `
Patient consultation transcript (specialty: ${specialty}):
${chatHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}

This transcript is from a consultation that has now ended. Summarize it into a
structured patient health report.

IMPORTANT RULES:
- Do NOT diagnose any condition.
- Do NOT suggest any treatment, medication, or dosage.
- Only summarize what the patient has actually said — do not infer or add symptoms not mentioned.
- "recommendedAction" must only be general next-step guidance (e.g. "consult a
  ${specialty} specialist within a few days"), never a treatment.

Respond with ONLY valid JSON (no markdown fences, no extra text), in exactly this shape:
{
  "chiefComplaint": "short summary of the main issue",
  "symptomsSummary": "structured summary of all symptoms mentioned, including duration/severity if stated",
  "duration": "how long symptoms have been present, or 'not specified'",
  "specialty": "${specialty}",
  "recommendedAction": "general next-step guidance, no treatment/medication"
}
`;

const FALLBACK_REPORT = (specialty) => ({
  chiefComplaint: 'Unable to generate summary at this time.',
  symptomsSummary: 'Please review the full chat transcript for details.',
  duration: 'not specified',
  specialty,
  recommendedAction: `Consult a ${specialty} specialist to review your symptoms.`
});

export const generateHealthReport = async ({ chatHistory, specialty }) => {
  const systemInstruction =
    'You are a precise medical-intake summarizer. No diagnosis, no treatment advice. Respond with valid JSON only.';
  const prompt = buildReportPrompt({ chatHistory, specialty });

  const result = await generateStructuredJson({ system: systemInstruction, prompt });

  // Defensive check — agar shape match nahi karta (fallback ya malformed response aaya), safe default do
  const isValidShape =
    result &&
    typeof result.chiefComplaint === 'string' &&
    typeof result.symptomsSummary === 'string';

  if (!isValidShape) {
    console.error('generateHealthReport: unexpected/invalid LLM response, using fallback report');
    return FALLBACK_REPORT(specialty);
  }

  return {
    chiefComplaint: result.chiefComplaint,
    symptomsSummary: result.symptomsSummary,
    duration: result.duration || 'not specified',
    specialty: result.specialty || specialty,
    recommendedAction: result.recommendedAction || `Consult a ${specialty} specialist.`
  };
};