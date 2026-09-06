PRAGMA foreign_keys = ON;

-- Subjects (matières) linked to institution, optionally to a department/program
CREATE TABLE IF NOT EXISTS subjects_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments_local(id) ON DELETE SET NULL,
  program_id TEXT REFERENCES programs_local(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  credit_hours REAL,
  coefficient REAL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, code),
  UNIQUE(institution_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_local_institution ON subjects_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_subjects_local_department ON subjects_local(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_local_program ON subjects_local(program_id);

-- Class groups (classes / groupes) linked to program, level, academic year
CREATE TABLE IF NOT EXISTS class_groups_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs_local(id) ON DELETE SET NULL,
  level_id TEXT REFERENCES levels_local(id) ON DELETE SET NULL,
  academic_year_id TEXT REFERENCES academic_years_local(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  capacity INTEGER,
  room_label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, academic_year_id, code),
  UNIQUE(institution_id, academic_year_id, name)
);

CREATE INDEX IF NOT EXISTS idx_class_groups_local_institution ON class_groups_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_local_program ON class_groups_local(program_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_local_level ON class_groups_local(level_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_local_year ON class_groups_local(academic_year_id);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (6, 'subjects_classes');
