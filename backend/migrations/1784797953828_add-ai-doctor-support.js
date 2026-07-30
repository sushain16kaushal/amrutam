export const up = (pgm) => {
  // AI doctors ko support karne ke liye — existing human doctors 
  // automatically 'human' default milega, koi data touch nahi hoga
  pgm.addColumn('doctors', {
    doctor_kind: {
      type: 'varchar(20)',
      notNull: true,
      default: 'human' // human | ai
    },
    ai_persona_config: {
      type: 'jsonb',
      notNull: false
      // sirf doctor_kind = 'ai' ke liye populate hoga
      // shape: { name, tone, specialty_system_prompt, disclaimer_text }
    }
  });

  // Chat messages mein sender ka type track karna — 
  // existing messages 'user' default lenge (jo ki sahi hi hai)
  pgm.addColumn('consultation_messages', {
    sender_kind: {
      type: 'varchar(20)',
      notNull: true,
      default: 'user' // patient | human_doctor | ai_doctor | system
    }
  });

  // AI doctor lookups fast karne ke liye (jaise Slot Manager job 
  // jo "sab AI doctors" query karega)
  pgm.createIndex('doctors', ['doctor_kind']);
};

export const down = (pgm) => {
  pgm.dropColumn('consultation_messages', 'sender_kind');
  pgm.dropColumn('doctors', ['doctor_kind', 'ai_persona_config']);
};
