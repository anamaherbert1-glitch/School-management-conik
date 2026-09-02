use rusqlite::{params, Connection};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use uuid::Uuid;

const MIGRATION_001: &str = include_str!("../../../web/lib/local/migrations/001_initial_platform.sql");

struct AppState {
    db: Mutex<Option<Connection>>,
}

#[derive(Debug, Serialize)]
pub struct LocalRuntimeStatus {
    pub initialized: bool,
    pub database_path: String,
    pub root_path: String,
    pub migration_version: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct LocalInstitution {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub country_code: String,
    pub timezone: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub logo_path: Option<String>,
    pub academic_year_label: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct LocalError {
    pub code: String,
    pub message: String,
}

impl From<rusqlite::Error> for LocalError {
    fn from(error: rusqlite::Error) -> Self {
        Self {
            code: "SQLITE_ERROR".into(),
            message: error.to_string(),
        }
    }
}

fn now() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".into())
}

fn conik_root() -> PathBuf {
    if let Ok(value) = std::env::var("CONIK_DATA_ROOT") {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }

    PathBuf::from(r"C:\CONIK")
}

fn create_directories(root: &Path) -> Result<(), LocalError> {
    let directories = [
        root.join("data"),
        root.join("documents\students"),
        root.join("documents\teachers"),
        root.join("documents\admissions"),
        root.join("documents\administrative"),
        root.join("generated\bulletins"),
        root.join("generated\transcripts"),
        root.join("generated\certificates"),
        root.join("generated\receipts"),
        root.join("generated\reports"),
        root.join("backups\automatic"),
        root.join("backups\manual"),
        root.join("logs"),
        root.join("config"),
    ];

    for directory in directories {
        fs::create_dir_all(&directory).map_err(|error| LocalError {
            code: "FILESYSTEM_ERROR".into(),
            message: format!("Unable to create {}: {error}", directory.display()),
        })?;
    }

    Ok(())
}

fn open_database() -> Result<(Connection, PathBuf), LocalError> {
    let root = conik_root();
    create_directories(&root)?;
    let database_path = root.join("data").join("conik.db");

    let connection = Connection::open(&database_path)?;
    connection.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")?;
    connection.execute_batch(MIGRATION_001)?;

    Ok((connection, database_path))
}

fn ensure_connection(state: &State<AppState>) -> Result<PathBuf, LocalError> {
    let mut guard = state.db.lock().map_err(|_| LocalError {
        code: "DB_LOCK_ERROR".into(),
        message: "Unable to acquire the local database lock".into(),
    })?;

    if guard.is_none() {
        let (connection, path) = open_database()?;
        *guard = Some(connection);
        return Ok(path);
    }

    Ok(conik_root().join("data").join("conik.db"))
}

#[tauri::command]
pub fn initialize_local_runtime(state: State<AppState>) -> Result<LocalRuntimeStatus, LocalError> {
    let database_path = ensure_connection(&state)?;
    let guard = state.db.lock().map_err(|_| LocalError {
        code: "DB_LOCK_ERROR".into(),
        message: "Unable to acquire the local database lock".into(),
    })?;
    let version = guard
        .as_ref()
        .and_then(|db| db.query_row("SELECT MAX(version) FROM schema_migrations", [], |row| row.get::<_, Option<i64>>(0)).ok())
        .flatten();

    Ok(LocalRuntimeStatus {
        initialized: database_path.exists(),
        database_path: database_path.display().to_string(),
        root_path: conik_root().display().to_string(),
        migration_version: version,
    })
}

#[tauri::command]
pub fn get_local_runtime_status(state: State<AppState>) -> Result<LocalRuntimeStatus, LocalError> {
    initialize_local_runtime(state)
}

#[tauri::command]
pub fn create_institution(
    state: State<AppState>,
    name: String,
    slug: String,
    country_code: Option<String>,
    timezone: Option<String>,
    address: Option<String>,
    city: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    website: Option<String>,
    logo_path: Option<String>,
    academic_year_label: Option<String>,
) -> Result<LocalInstitution, LocalError> {
    let trimmed_name = name.trim();
    let trimmed_slug = slug.trim();
    if trimmed_name.is_empty() || trimmed_slug.is_empty() {
        return Err(LocalError {
            code: "VALIDATION_ERROR".into(),
            message: "Institution name and slug are required".into(),
        });
    }

    ensure_connection(&state)?;
    let guard = state.db.lock().map_err(|_| LocalError {
        code: "DB_LOCK_ERROR".into(),
        message: "Unable to acquire the local database lock".into(),
    })?;
    let db = guard.as_ref().ok_or_else(|| LocalError {
        code: "DB_NOT_INITIALIZED".into(),
        message: "Local database is not initialized".into(),
    })?;

    let id = Uuid::new_v4().to_string();
    let timestamp = now();
    let country_code = country_code.unwrap_or_else(|| "TG".into());
    let timezone = timezone.unwrap_or_else(|| "Africa/Lome".into());

    db.execute(
        "INSERT INTO institution (id, name, slug, country_code, timezone, address, city, phone, email, website, logo_path, academic_year_label, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)",
        params![id, trimmed_name, trimmed_slug, country_code, timezone, address, city, phone, email, website, logo_path, academic_year_label, timestamp],
    )?;

    get_institution_from_db(db, &id)
}

#[tauri::command]
pub fn get_institution(state: State<AppState>, id: String) -> Result<Option<LocalInstitution>, LocalError> {
    ensure_connection(&state)?;
    let guard = state.db.lock().map_err(|_| LocalError {
        code: "DB_LOCK_ERROR".into(),
        message: "Unable to acquire the local database lock".into(),
    })?;
    let db = guard.as_ref().ok_or_else(|| LocalError {
        code: "DB_NOT_INITIALIZED".into(),
        message: "Local database is not initialized".into(),
    })?;

    match get_institution_from_db(db, &id) {
        Ok(institution) => Ok(Some(institution)),
        Err(error) if error.code == "NOT_FOUND" => Ok(None),
        Err(error) => Err(error),
    }
}

fn get_institution_from_db(db: &Connection, id: &str) -> Result<LocalInstitution, LocalError> {
    db.query_row(
        "SELECT id, name, slug, country_code, timezone, address, city, phone, email, website, logo_path, academic_year_label, created_at, updated_at FROM institution WHERE id = ?1",
        params![id],
        |row| {
            Ok(LocalInstitution {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                country_code: row.get(3)?,
                timezone: row.get(4)?,
                address: row.get(5)?,
                city: row.get(6)?,
                phone: row.get(7)?,
                email: row.get(8)?,
                website: row.get(9)?,
                logo_path: row.get(10)?,
                academic_year_label: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    )
    .map_err(|error| match error {
        rusqlite::Error::QueryReturnedNoRows => LocalError {
            code: "NOT_FOUND".into(),
            message: "Institution not found".into(),
        },
        other => other.into(),
    })
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![
            initialize_local_runtime,
            get_local_runtime_status,
            create_institution,
            get_institution
        ])
        .run(tauri::generate_context!())
        .expect("error while running CONIK desktop application");
}
