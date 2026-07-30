import OpenAI from 'openai';
import {env} from '../../config/env.js';
if (!env.groqApiKey) {
  console.warn('GROQ_API_KEY not set — AI doctor responses will fail at call time.');
}

const client = new OpenAI({
  apiKey: env.groqApiKey,
  baseURL: 'https://api.groq.com/openai/v1'
});

const MODEL = 'llama-3.3-70b-versatile';

const mapRole = (role) => (role === 'assistant' ? 'assistant' : 'user');

export const generateAiDoctorResponse = async ({ system, messages }) => {
  if (!messages || messages.length === 0) {
    throw new Error('generateAiDoctorResponse: messages array khaali hai');
  }

  const chatMessages = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: mapRole(m.role), content: m.content }))
  ];

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: chatMessages
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('generateAiDoctorResponse: LLM call failed —', err.message);
    return "I'm having trouble responding right now. Please try again in a moment, or contact support if this continues.";
  }
};

export const generateStructuredJson = async ({ system, prompt }) => {
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const raw = response.choices[0].message.content;
    return JSON.parse(raw);
  } catch (err) {
    console.error('generateStructuredJson: LLM call ya JSON-parse fail —', err.message);
    return { escalate: false, reason: null, severity: null };
  }
};
