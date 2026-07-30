import { KNOWLEDGE_BASE_BATCH_1 } from '../data/knowledge-base-batch1.js';
import { KNOWLEDGE_BASE_BATCH_2 } from '../data/knowledge-base-batch2.js';
import { KNOWLEDGE_BASE_BATCH_3 } from '../data/knowledge-base-batch3.js';
import { embedText, toVectorLiteral } from '../src/modules/ai-agents/embedding.util.js';
import { insertKnowledgeChunk, countKnowledgeChunks } from '../src/modules/ai-agents/knowledgeChunks.repository.js';
import pool from '../src/config/db.js';

const BATCHES = [KNOWLEDGE_BASE_BATCH_1, KNOWLEDGE_BASE_BATCH_2, KNOWLEDGE_BASE_BATCH_3];

const run = async () => {
  const allChunks = BATCHES.flat();
  console.log(`Seeding ${allChunks.length} knowledge chunks...`);

  let inserted = 0;
  for (const chunk of allChunks) {
    const embedding = await embedText(`${chunk.topic}. ${chunk.content}`);
    const embeddingLiteral = toVectorLiteral(embedding);

    const row = await insertKnowledgeChunk({
      specialty: chunk.specialty,
      topic: chunk.topic,
      content: chunk.content,
      source: chunk.source,
      embeddingLiteral
    });

    inserted += 1;
    console.log(`[${inserted}/${allChunks.length}] Inserted: ${row.specialty} — ${row.topic}`);
  }

  const total = await countKnowledgeChunks();
  console.log(`\nDone. Total rows in knowledge_chunks: ${total}`);

  await pool.end();
};

run().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
