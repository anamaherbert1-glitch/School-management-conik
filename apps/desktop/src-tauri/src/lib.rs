use argon2::{password_hash::{rand_core::OsRng, PasswordHasher, SaltString}, Argon2};
use rusqlite::{params, Connection};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use uuid::Uuid;

const MIGRATION_001: &str = include_str!("../../../web/lib/local/migrations/001_initial_platform.sql");
const MIGRATION_002: &str = include_str!("../../../web/lib/local/migrations/002_local_admin_settings.sql");

struct AppState { db: Mutex<Option<Connection>> }

#[derive(Debug, Serialize)]
pub struct LocalRuntimeStatus { pub initialized: bool, pub database_path: String, pub root_path: String, pub migration_version: Option<i64> }

#[derive(Debug, Serialize)]
pub struct LocalInstitution {
    pub id: String, pub name: String, pub slug: String, pub country_code: String, pub timezone: String,
    pub address: Option<String>, pub city: Option<String>, pub phone: Option<String>, pub email: Option<String>,
    pub website: Option<String>, pub logo_path: Option<String>, pub academic_year_label: Option<String>,
    pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct LocalUser { pub id: String, pub username: String, pub first_name: String, pub last_name: String, pub phone: Option<String>, pub role: String, pub active: bool, pub institution_id: Option<String>, pub created_at: String, pub updated_at: String }

#[derive(Debug, Serialize)]
pub struct InstitutionSettings { pub institution_id: String, pub currency_code: String, pub locale: String, pub country_code: String, pub timezone: String, pub academic_year_label: Option<String>, pub updated_at: String }

#[derive(Debug, Serialize)]
pub struct LocalError { pub code: String, pub message: String }
impl From<rusqlite::Error> for LocalError { fn from(error: rusqlite::Error) -> Self { Self { code: "SQLITE_ERROR".into(), message: error.to_string() } } }

fn now() -> String { SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis().to_string()).unwrap_or_else(|_| "0".into()) }
fn conik_root() -> PathBuf { std::env::var("CONIK_DATA_ROOT").ok().filter(|v| !v.trim().is_empty()).map(PathBuf::from).unwrap_or_else(|| PathBuf::from(r"C:\CONIK")) }
fn create_directories(root: &Path) -> Result<(), LocalError> {
    for directory in [root.join("data"), root.join("documents").join("students"), root.join("documents").join("teachers"), root.join("documents").join("admissions"), root.join("documents").join("administrative"), root.join("generated").join("bulletins"), root.join("generated").join("transcripts"), root.join("generated").join("certificates"), root.join("generated").join("receipts"), root.join("generated").join("reports"), root.join("backups").join("automatic"), root.join("backups").join("manual"), root.join("logs"), root.join("config")] {
        fs::create_dir_all(&directory).map_err(|error| LocalError { code: "FILESYSTEM_ERROR".into(), message: format!("Unable to create {}: {error}", directory.display()) })?;
    }
    Ok(())
}
fn open_database() -> Result<(Connection, PathBuf), LocalError> {
    let root = conik_root(); create_directories(&root)?; let database_path = root.join("data").join("conik.db");
    let connection = Connection::open(&database_path)?;
    connection.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")?;
    connection.execute_batch(MIGRATION_001)?; connection.execute_batch(MIGRATION_002)?;
    Ok((connection, database_path))
}
fn ensure_connection(state: &State<AppState>) -> Result<PathBuf, LocalError> {
    let mut guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?;
    if guard.is_none() { let (connection, path) = open_database()?; *guard = Some(connection); return Ok(path); }
    Ok(conik_root().join("data").join("conik.db"))
}
fn runtime_status(state: &State<AppState>) -> Result<LocalRuntimeStatus, LocalError> {
    let database_path = ensure_connection(state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?;
    let version = guard.as_ref().and_then(|db| db.query_row("SELECT MAX(version) FROM schema_migrations", [], |row| row.get::<_, Option<i64>>(0)).ok().flatten());
    Ok(LocalRuntimeStatus { initialized: database_path.exists(), database_path: database_path.display().to_string(), root_path: conik_root().display().to_string(), migration_version: version })
}
#[tauri::command] pub fn initialize_local_runtime(state: State<AppState>) -> Result<LocalRuntimeStatus, LocalError> { runtime_status(&state) }
#[tauri::command] pub fn get_local_runtime_status(state: State<AppState>) -> Result<LocalRuntimeStatus, LocalError> { runtime_status(&state) }

#[tauri::command]
pub fn create_institution(state: State<AppState>, name: String, slug: String, country_code: Option<String>, timezone: Option<String>, address: Option<String>, city: Option<String>, phone: Option<String>, email: Option<String>, website: Option<String>, logo_path: Option<String>, academic_year_label: Option<String>) -> Result<LocalInstitution, LocalError> {
    let trimmed_name = name.trim(); let trimmed_slug = slug.trim();
    if trimmed_name.is_empty() || trimmed_slug.is_empty() { return Err(LocalError { code: "VALIDATION_ERROR".into(), message: "Institution name and slug are required".into() }); }
    ensure_connection(&state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?; let db = guard.as_ref().ok_or_else(|| LocalError { code: "DB_NOT_INITIALIZED".into(), message: "Local database is not initialized".into() })?;
    let id = Uuid::new_v4().to_string(); let timestamp = now(); let country_code = country_code.unwrap_or_else(|| "TG".into()); let timezone = timezone.unwrap_or_else(|| "Africa/Lome".into());
    let tx = db.unchecked_transaction()?;
    tx.execute("INSERT INTO institution (id,name,slug,country_code,timezone,address,city,phone,email,website,logo_path,academic_year_label,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?13)", params![id, trimmed_name, trimmed_slug, country_code, timezone, address, city, phone, email, website, logo_path, academic_year_label, timestamp])?;
    tx.execute("INSERT INTO institution_settings (institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at) VALUES (?1,'XOF','fr-FR',?2,?3,?4,?5)", params![id, country_code, timezone, academic_year_label, timestamp])?;
    tx.commit()?; get_institution_from_db(db, &id)
}

#[tauri::command]
pub fn get_institution(state: State<AppState>, id: String) -> Result<Option<LocalInstitution>, LocalError> {
    ensure_connection(&state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?; let db = guard.as_ref().ok_or_else(|| LocalError { code: "DB_NOT_INITIALIZED".into(), message: "Local database is not initialized".into() })?;
    match get_institution_from_db(db, &id) { Ok(v) => Ok(Some(v)), Err(e) if e.code == "NOT_FOUND" => Ok(None), Err(e) => Err(e) }
}
fn get_institution_from_db(db: &Connection, id: &str) -> Result<LocalInstitution, LocalError> {
    db.query_row("SELECT id,name,slug,country_code,timezone,address,city,phone,email,website,logo_path,academic_year_label,created_at,updated_at FROM institution WHERE id=?1", params![id], |row| Ok(LocalInstitution { id: row.get(0)?, name: row.get(1)?, slug: row.get(2)?, country_code: row.get(3)?, timezone: row.get(4)?, address: row.get(5)?, city: row.get(6)?, phone: row.get(7)?, email: row.get(8)?, website: row.get(9)?, logo_path: row.get(10)?, academic_year_label: row.get(11)?, created_at: row.get(12)?, updated_at: row.get(13)? })).map_err(|error| match error { rusqlite::Error::QueryReturnedNoRows => LocalError { code: "NOT_FOUND".into(), message: "Institution not found".into() }, other => other.into() })
}

#[tauri::command]
pub fn bootstrap_local_admin(state: State<AppState>, institution_id: String, username: String, password: String, first_name: String, last_name: String, phone: Option<String>) -> Result<LocalUser, LocalError> {
    let username = username.trim().to_lowercase(); let first_name = first_name.trim(); let last_name = last_name.trim();
    if institution_id.trim().is_empty() || username.is_empty() || password.len() < 8 || first_name.is_empty() || last_name.is_empty() { return Err(LocalError { code: "VALIDATION_ERROR".into(), message: "Institution, names, username and a password of at least 8 characters are required".into() }); }
    ensure_connection(&state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?; let db = guard.as_ref().ok_or_else(|| LocalError { code: "DB_NOT_INITIALIZED".into(), message: "Local database is not initialized".into() })?;
    if db.query_row("SELECT 1 FROM institution WHERE id=?1", params![institution_id], |_| Ok(())).is_err() { return Err(LocalError { code: "NOT_FOUND".into(), message: "Institution not found".into() }); }
    if db.query_row("SELECT 1 FROM local_users WHERE institution_id=?1", params![institution_id], |_| Ok(())).is_ok() { return Err(LocalError { code: "ADMIN_ALREADY_EXISTS".into(), message: "A local administrator already exists for this institution".into() }); }
    if db.query_row("SELECT 1 FROM local_users WHERE username=?1", params![username], |_| Ok(())).is_ok() { return Err(LocalError { code: "USERNAME_EXISTS".into(), message: "This username is already in use".into() }); }
    let salt = SaltString::generate(&mut OsRng); let password_hash = Argon2::default().hash_password(password.as_bytes(), &salt).map_err(|e| LocalError { code: "PASSWORD_HASH_ERROR".into(), message: e.to_string() })?.to_string();
    let id = Uuid::new_v4().to_string(); let timestamp = now();
    db.execute("INSERT INTO local_users (id,username,password_hash,first_name,last_name,phone,role,active,institution_id,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,'super_admin',1,?7,?8,?8)", params![id, username, password_hash, first_name, last_name, phone, institution_id, timestamp])?;
    db.query_row("SELECT id,username,first_name,last_name,phone,role,active,institution_id,created_at,updated_at FROM local_users WHERE id=?1", params![id], local_user_from_row).map_err(Into::into)
}
fn local_user_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<LocalUser> { Ok(LocalUser { id: row.get(0)?, username: row.get(1)?, first_name: row.get(2)?, last_name: row.get(3)?, phone: row.get(4)?, role: row.get(5)?, active: row.get::<_, i64>(6)? == 1, institution_id: row.get(7)?, created_at: row.get(8)?, updated_at: row.get(9)? }) }

#[tauri::command]
pub fn get_local_admin(state: State<AppState>, institution_id: String) -> Result<Option<LocalUser>, LocalError> {
    ensure_connection(&state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?; let db = guard.as_ref().ok_or_else(|| LocalError { code: "DB_NOT_INITIALIZED".into(), message: "Local database is not initialized".into() })?;
    match db.query_row("SELECT id,username,first_name,last_name,phone,role,active,institution_id,created_at,updated_at FROM local_users WHERE institution_id=?1 ORDER BY created_at LIMIT 1", params![institution_id], local_user_from_row) { Ok(v) => Ok(Some(v)), Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None), Err(e) => Err(e.into()) }
}

#[tauri::command]
pub fn get_institution_settings(state: State<AppState>, institution_id: String) -> Result<Option<InstitutionSettings>, LocalError> {
    ensure_connection(&state)?; let guard = state.db.lock().map_err(|_| LocalError { code: "DB_LOCK_ERROR".into(), message: "Unable to acquire the local database lock".into() })?; let db = guard.as_ref().ok_or_else(|| LocalError { code: "DB_NOT_INITIALIZED".into(), message: "Local database is not initialized".into() })?;
    match db.query_row("SELECT institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at FROM institution_settings WHERE institution_id=?1", params![institution_id], |r| Ok(InstitutionSettings { institution_id:r.get(0)?, currency_code:r.get(1)?, locale:r.get(2)?, country_code:r.get(3)?, timezone:r.get(4)?, academic_year_label:r.get(5)?, updated_at:r.get(6)? })) { Ok(v)=>Ok(Some(v)), Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(None), Err(e)=>Err(e.into()) }
}

#[tauri::command]
pub fn update_institution_settings(state: State<AppState>, institution_id: String, currency_code: String, locale: String, country_code: String, timezone: String, academic_year_label: Option<String>) -> Result<InstitutionSettings, LocalError> {
    if currency_code.trim().is_empty() || locale.trim().is_empty() || country_code.trim().is_empty() || timezone.trim().is_empty() { return Err(LocalError { code:"VALIDATION_ERROR".into(), message:"Currency, locale, country and timezone are required".into() }); }
    ensure_connection(&state)?; let guard=state.db.lock().map_err(|_|LocalError{code:"DB_LOCK_ERROR".into(),message:"Unable to acquire the local database lock".into()})?; let db=guard.as_ref().ok_or_else(||LocalError{code:"DB_NOT_INITIALIZED".into(),message:"Local database is not initialized".into()})?; let timestamp=now();
    db.execute("INSERT INTO institution_settings (institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(institution_id) DO UPDATE SET currency_code=excluded.currency_code,locale=excluded.locale,country_code=excluded.country_code,timezone=excluded.timezone,academic_year_label=excluded.academic_year_label,updated_at=excluded.updated_at", params![institution_id,currency_code,locale,country_code,timezone,academic_year_label,timestamp])?;
    db.query_row("SELECT institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at FROM institution_settings WHERE institution_id=?1", params![institution_id], |r| Ok(InstitutionSettings{institution_id:r.get(0)?,currency_code:r.get(1)?,locale:r.get(2)?,country_code:r.get(3)?,timezone:r.get(4)?,academic_year_label:r.get(5)?,updated_at:r.get(6)?})).map_err(Into::into)
}

pub fn run() { tauri::Builder::default().manage(AppState { db: Mutex::new(None) }).invoke_handler(tauri::generate_handler![initialize_local_runtime,get_local_runtime_status,create_institution,get_institution,bootstrap_local_admin,get_local_admin,get_institution_settings,update_institution_settings]).run(tauri::generate_context!()).expect("error while running CONIK desktop application"); }
