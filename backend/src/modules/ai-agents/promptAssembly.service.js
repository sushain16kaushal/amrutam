// backend/modules/ai-agents/promptAssembly.service.js
//
// Pure functions — koi DB call nahi, koi LLM call nahi. Input: persona config +
// retrieved chunks + chat history + current message. Output: { system, messages }
// jo seedha Groq/Gemini/Anthropic-style chat-completion API ko pass kiya ja sake.
//
// Provider-agnostic isliye rakha hai — LLM client wiring alag step hai (agla phase).

// test-rag-retrieval.js se calibrate kiya gaya threshold — in-specialty queries
// 0.48-0.74 range mein the, out-of-specialty 0.03-0.22. 0.35 dono ke beech
// comfortable margin ke saath baithta hai.
export const SIMILARITY_THRESHOLD = 0.35;

const buildContextSection = (retrievedChunks) => {
  const groundedChunks = retrievedChunks.filter((c) => c.similarity >= SIMILARITY_THRESHOLD);

  if (groundedChunks.length === 0) {
    return (
      'No closely-matching reference information was found in the knowledge base for this query. ' +
      'If the question is outside your specialty, say so politely and suggest the patient consult ' +
      'the appropriate specialist or their primary doctor. Do not fabricate specific medical facts.'
    );
  }

  const chunkLines = groundedChunks
    .map((c) => `- ${c.topic}: ${c.content}`)
    .join('\n');

  return (
    'Relevant reference information (use this to ground your answer in your own words — ' +
    'do not copy verbatim):\n' + chunkLines
  );
};

const buildSafetyNote = (safetyFlags = []) => {
  if (safetyFlags.length === 0) return '';
  return (
    `Pay close attention for these situations during the conversation: ${safetyFlags.join(', ')}. ` +
    'If any of these appear, clearly and firmly recommend the patient seek in-person / urgent care — ' +
    'do not attempt to manage these purely through chat.'
  );
};

export const buildSystemPrompt = ({ personaConfig, retrievedChunks }) => {
  const { system_prompt, tone, disclaimer_text, safety_flags = [] } = personaConfig;

  const sections = [
    system_prompt,
    tone ? `Tone: ${tone}.` : null,
    buildContextSection(retrievedChunks),
    buildSafetyNote(safety_flags),
    disclaimer_text
      ? `Always end your response with this disclaimer, verbatim: "${disclaimer_text}"`
      : null
  ];

  return sections.filter(Boolean).join('\n\n');
};

// chatHistory expected shape: [{ role: 'user' | 'assistant', content: string }, ...]
// (consultation_messages se map karke banega — sender_kind='patient' -> 'user',
// sender_kind='ai_doctor' -> 'assistant'; woh mapping chat-pipeline layer ki zimmedari hai)
export const buildMessages = ({ chatHistory = [], message }) => {
  return [...chatHistory, { role: 'user', content: message }];
};

export const assembleLlmRequest = ({ personaConfig, retrievedChunks, chatHistory = [], message }) => {
  return {
    system: buildSystemPrompt({ personaConfig, retrievedChunks }),
    messages: buildMessages({ chatHistory, message })
  };
};
