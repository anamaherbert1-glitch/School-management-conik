PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS levels_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL DEFAULT 1 CHECK (sequence > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, code),
  UNIQUE(institution_id, name)
);

CREATE INDEX IF NOT EXISTS idx_levels_local_institution ON levels_local(institution_id);

CREATE TABLE IF NOT EXISTS departments_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, code),
  UNIQUE(institution_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_local_institution ON departments_local(institution_id);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (4, 'levels_departments');
