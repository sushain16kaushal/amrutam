export const up = (pgm) => {
  pgm.createExtension('pg_trgm', { ifNotExists: true });

  // Trigram GIN index — fuzzy/partial name search fast banata hai
  pgm.sql(`CREATE INDEX idx_profiles_fullname_trgm ON profiles USING GIN (full_name gin_trgm_ops)`);
  pgm.sql(`CREATE INDEX idx_doctors_specialty_trgm ON doctors USING GIN (specialty gin_trgm_ops)`);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_profiles_fullname_trgm`);
  pgm.sql(`DROP INDEX IF EXISTS idx_doctors_specialty_trgm`);
  pgm.dropExtension('pg_trgm');
};
