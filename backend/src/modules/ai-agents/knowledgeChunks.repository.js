// backend/modules/ai-agents/knowledgeChunks.repository.js
import pool from '../../config/db.js';

export const insertKnowledgeChunk = async ({ specialty, topic, content, source, embeddingLiteral }) => {
  const result = await pool.query(
    `INSERT INTO knowledge_chunks (specialty, topic, content, source, embedding)
     VALUES ($1, $2, $3, $4, $5::vector)
     RETURNING id, specialty, topic`,
    [specialty, topic, content, source, embeddingLiteral]
  );
  return result.rows[0];
};

export const countKnowledgeChunks = async () => {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM knowledge_chunks`);
  return result.rows[0].count;
};

export const countKnowledgeChunksWithEmbedding = async () => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM knowledge_chunks WHERE embedding IS NOT NULL`
  );
  return result.rows[0].count;
};

// Phase 2 RAG retrieval isko baad mein use karega — specialty-filtered cosine similarity search
export const findSimilarChunks = async ({ queryEmbeddingLiteral, specialty, limit = 5 }) => {
  const result = await pool.query(
    `SELECT id, specialty, topic, content, source,
            1 - (embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks
     WHERE specialty = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [queryEmbeddingLiteral, specialty, limit]
  );
  return result.rows;
};
