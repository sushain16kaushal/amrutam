export const up = (pgm) => {
  pgm.createExtension('vector', { ifNotExists: true });

  pgm.createTable('knowledge_chunks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    specialty: {
      type: 'varchar(100)',
      notNull: true
    },
    topic: {
      type: 'varchar(255)',
      notNull: true
    },
    content: {
      type: 'text',
      notNull: true
    },
    source: {
      type: 'varchar(255)'
    },
    embedding: {
      type: 'vector(384)',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('knowledge_chunks', 'specialty');

  pgm.sql(`
    CREATE INDEX knowledge_chunks_embedding_idx 
    ON knowledge_chunks 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 10)
  `);
};

export const down = (pgm) => {
  pgm.dropTable('knowledge_chunks');
};