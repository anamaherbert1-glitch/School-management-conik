PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS academic_years_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','closed')),
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, label)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_year_current
  ON academic_years_local(institution_id) WHERE is_current = 1;
CREATE INDEX IF NOT EXISTS idx_academic_years_local_institution ON academic_years_local(institution_id);

CREATE TABLE IF NOT EXISTS semesters_local (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL REFERENCES academic_years_local(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(academic_year_id, code),
  UNIQUE(academic_year_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_semesters_local_year ON semesters_local(academic_year_id);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (3, 'academic_years_semesters');
