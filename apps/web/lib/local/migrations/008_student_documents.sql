PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_documents_local (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students_local(id) ON DELETE CASCADE,
  institution_id TEXT NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('identity','birth_certificate','photo','transcript','medical','report','other')),
  file_name TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK(size_bytes >= 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents_local(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_institution ON student_documents_local(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON student_documents_local(student_id, doc_type);

INSERT OR IGNORE INTO schema_migrations(version, name) VALUES (8, 'student_documents');
