PRAGMA foreign_keys = ON;

ALTER TABLE local_users ADD COLUMN institution_id TEXT REFERENCES institution(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_local_users_institution_id ON local_users(institution_id);

CREATE TABLE IF NOT EXISTS institution_settings (
  institution_id TEXT PRIMARY KEY REFERENCES institution(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL DEFAULT 'XOF',
  locale TEXT NOT NULL DEFAULT 'fr-FR',
  country_code TEXT NOT NULL DEFAULT 'TG',
  timezone TEXT NOT NULL DEFAULT 'Africa/Lome',
  academic_year_label TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (2, 'local_admin_settings');
