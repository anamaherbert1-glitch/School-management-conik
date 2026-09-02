use rusqlite::{params, Connection};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

const MIGRATION_001: &str = include_str!("../../../web/lib/local/migrations/001_initial_platform.sql");

fn test_root() -> PathBuf {
    std::env::temp_dir().join(format!("conik-arch2b-{}", Uuid::new_v4()))
}

#[test]
fn sqlite_migration_and_institution_survive_reopen() {
    let root = test_root();
    fs::create_dir_all(root.join("data")).expect("create data directory");
    let db_path = root.join("data").join("conik.db");

    let institution_id = Uuid::new_v4().to_string();
    {
        let connection = Connection::open(&db_path).expect("open sqlite database");
        connection
            .execute_batch(
                "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;",
            )
            .expect("configure sqlite");
        connection
            .execute_batch(MIGRATION_001)
            .expect("apply initial migration");

        connection
            .execute(
                "INSERT INTO institution (id, name, slug, country_code, timezone, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
                params![
                    institution_id,
                    "CONIK Test School",
                    "conik-test-school",
                    "TG",
                    "Africa/Lome",
                    "test-time"
                ],
            )
            .expect("persist institution");
    }

    {
        let reopened = Connection::open(&db_path).expect("reopen sqlite database");
        let (name, migration_version): (String, i64) = reopened
            .query_row(
                "SELECT (SELECT name FROM institution WHERE id = ?1), (SELECT MAX(version) FROM schema_migrations)",
                params![institution_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .expect("read persisted data");

        assert_eq!(name, "CONIK Test School");
        assert_eq!(migration_version, 1);
    }

    fs::remove_dir_all(root).expect("cleanup test data");
}
