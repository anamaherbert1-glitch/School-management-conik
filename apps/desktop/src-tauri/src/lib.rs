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
const MIGRATION_003: &str = include_str!("../../../web/lib/local/migrations/003_academic_years_semesters.sql");
const MIGRATION_004: &str = include_str!("../../../web/lib/local/migrations/004_levels_departments.sql");
const MIGRATION_005: &str = include_str!("../../../web/lib/local/migrations/005_programs.sql");
const MIGRATION_006: &str = include_str!("../../../web/lib/local/migrations/006_subjects_classes.sql");
const MIGRATION_007: &str = include_str!("../../../web/lib/local/migrations/007_students_enrollments.sql");
struct AppState { db: Mutex<Option<Connection>> }
#[derive(Debug,Serialize)] pub struct LocalRuntimeStatus { pub initialized:bool,pub database_path:String,pub root_path:String,pub migration_version:Option<i64> }
#[derive(Debug,Serialize)] pub struct LocalInstitution { pub id:String,pub name:String,pub slug:String,pub country_code:String,pub timezone:String,pub address:Option<String>,pub city:Option<String>,pub phone:Option<String>,pub email:Option<String>,pub website:Option<String>,pub logo_path:Option<String>,pub academic_year_label:Option<String>,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct LocalUser { pub id:String,pub username:String,pub first_name:String,pub last_name:String,pub phone:Option<String>,pub role:String,pub active:bool,pub institution_id:Option<String>,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct InstitutionSettings { pub institution_id:String,pub currency_code:String,pub locale:String,pub country_code:String,pub timezone:String,pub academic_year_label:Option<String>,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct AcademicYear { pub id:String,pub institution_id:String,pub label:String,pub start_date:String,pub end_date:String,pub status:String,pub is_current:bool,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Semester { pub id:String,pub academic_year_id:String,pub name:String,pub code:String,pub start_date:String,pub end_date:String,pub sequence:i64,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Level { pub id:String,pub institution_id:String,pub name:String,pub code:String,pub description:Option<String>,pub sequence:i64,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Department { pub id:String,pub institution_id:String,pub name:String,pub code:String,pub description:Option<String>,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Program { pub id:String,pub institution_id:String,pub department_id:Option<String>,pub level_id:Option<String>,pub name:String,pub code:String,pub description:Option<String>,pub duration_years:Option<i64>,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct LocalError { pub code:String,pub message:String }
impl From<rusqlite::Error> for LocalError { fn from(e:rusqlite::Error)->Self{Self{code:"SQLITE_ERROR".into(),message:e.to_string()}} }
fn now()->String{SystemTime::now().duration_since(UNIX_EPOCH).map(|d|d.as_millis().to_string()).unwrap_or_else(|_|"0".into())}
fn root()->PathBuf{std::env::var("CONIK_DATA_ROOT").ok().filter(|v|!v.trim().is_empty()).map(PathBuf::from).unwrap_or_else(||PathBuf::from(r"C:\\CONIK"))}
fn dirs(r:&Path)->Result<(),LocalError>{for p in [r.join("data"),r.join("documents/students"),r.join("documents/teachers"),r.join("documents/admissions"),r.join("documents/administrative"),r.join("generated/bulletins"),r.join("generated/transcripts"),r.join("generated/certificates"),r.join("generated/receipts"),r.join("generated/reports"),r.join("backups/automatic"),r.join("backups/manual"),r.join("logs"),r.join("config")]{fs::create_dir_all(&p).map_err(|e|LocalError{code:"FILESYSTEM_ERROR".into(),message:e.to_string()})?;}Ok(())}
fn open_database()->Result<(Connection,PathBuf),LocalError>{let r=root();dirs(&r)?;let p=r.join("data/conik.db");let c=Connection::open(&p)?;c.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;c.execute_batch(MIGRATION_001)?;let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<2{c.execute_batch(MIGRATION_002)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<3{c.execute_batch(MIGRATION_003)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<4{c.execute_batch(MIGRATION_004)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<5{c.execute_batch(MIGRATION_005)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<6{c.execute_batch(MIGRATION_006)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<7{c.execute_batch(MIGRATION_007)?;}Ok((c,p))}
fn ensure(state:&State<AppState>)->Result<PathBuf,LocalError>{let mut g=state.db.lock().map_err(|_|LocalError{code:"DB_LOCK_ERROR".into(),message:"Unable to acquire local database lock".into()})?;if g.is_none(){let(c,p)=open_database()?;*g=Some(c);return Ok(p)}Ok(root().join("data/conik.db"))}
fn lock(state:&State<AppState>)->Result<std::sync::MutexGuard<'_,Option<Connection>>,LocalError>{state.db.lock().map_err(|_|LocalError{code:"DB_LOCK_ERROR".into(),message:"Unable to acquire local database lock".into()})}
#[tauri::command] pub fn initialize_local_runtime(state:State<AppState>)->Result<LocalRuntimeStatus,LocalError>{let p=ensure(&state)?;let g=lock(&state)?;let v=g.as_ref().and_then(|c|c.query_row("SELECT MAX(version) FROM schema_migrations",[],|r|r.get::<_,Option<i64>>(0)).ok().flatten());Ok(LocalRuntimeStatus{initialized:p.exists(),database_path:p.display().to_string(),root_path:root().display().to_string(),migration_version:v})}
#[tauri::command] pub fn get_local_runtime_status(state:State<AppState>)->Result<LocalRuntimeStatus,LocalError>{initialize_local_runtime(state)}
pub fn run(){tauri::Builder::default().manage(AppState{db:Mutex::new(None)}).invoke_handler(tauri::generate_handler![initialize_local_runtime,get_local_runtime_status]).run(tauri::generate_context!()).expect("error while running CONIK desktop application");}
