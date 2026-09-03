PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS programs_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments_local(id) ON DELETE SET NULL,
  level_id TEXT REFERENCES levels_local(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  duration_years INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, code),
  UNIQUE(institution_id, name)
);

CREATE INDEX IF NOT EXISTS idx_programs_local_institution ON programs_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_local_department ON programs_local(department_id);
CREATE INDEX IF NOT EXISTS idx_programs_local_level ON programs_local(level_id);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (5, 'programs');
