PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students_local (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK(gender IS NULL OR gender IN ('M','F','O')),
  birth_date TEXT,
  birth_place TEXT,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','graduated','transferred','suspended')),
  photo_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(institution_id, student_number)
);

CREATE INDEX IF NOT EXISTS idx_students_local_institution ON students_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_local_name ON students_local(institution_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_local_status ON students_local(institution_id, status);

CREATE TABLE IF NOT EXISTS enrollments_local (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students_local(id) ON DELETE CASCADE,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  academic_year_id TEXT NOT NULL REFERENCES academic_years_local(id) ON DELETE RESTRICT,
  program_id TEXT REFERENCES programs_local(id) ON DELETE SET NULL,
  level_id TEXT REFERENCES levels_local(id) ON DELETE SET NULL,
  class_group_id TEXT REFERENCES class_groups_local(id) ON DELETE SET NULL,
  enrollment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','withdrawn','transferred')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_local_institution ON enrollments_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_local_year ON enrollments_local(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_local_class ON enrollments_local(class_group_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_local_student ON enrollments_local(student_id);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (7, 'students_enrollments');
