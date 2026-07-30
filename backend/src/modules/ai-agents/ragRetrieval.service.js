// backend/modules/ai-agents/ragRetrieval.service.js
//
// Do responsibilities, do functions — deliberately split:
// 1. getSpecialtyForConsultation — DB lookup (chat pipeline isko session-start pe
//    ek baar call kare aur cache kar le; har message pe dobara query karne ki
//    zaroorat nahi, jaisa discuss hua tha)
// 2. retrieveRelevantChunks — pure retrieval, specialty already pata hone ki assumption
//    pe (caller responsible hai cached specialty pass karne ke liye)
//
// Yeh split isliye taaki caching-decision chat-pipeline layer mein rahe, retrieval
// service stateless rahe — testing aur reuse dono aasan.

import { embedText, toVectorLiteral } from './embedding.util.js';
import { findSimilarChunks } from './knowledgeChunks.repository.js';
import { findSpecialtyByConsultationId } from '../consultations/consultations.repository.js'

export const getSpecialtyForConsultation = async (consultationId) => {
  const specialty = await findSpecialtyByConsultationId(consultationId);
  if (!specialty) {
    throw new Error(`No specialty found for consultation ${consultationId}`);
  }
  return specialty;
};

// message -> embed -> specialty-filtered top-k similar chunks
export const retrieveRelevantChunks = async ({ specialty, message, topK = 5 }) => {
  const queryEmbedding = await embedText(message);
  const queryEmbeddingLiteral = toVectorLiteral(queryEmbedding);

  const chunks = await findSimilarChunks({
    queryEmbeddingLiteral,
    specialty,
    limit: topK
  });

  return chunks; // [{ id, specialty, topic, content, source, similarity }, ...]
};