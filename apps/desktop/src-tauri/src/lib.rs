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
fn root()->PathBuf{std::env::var("CONIK_DATA_ROOT").ok().filter(|v|!v.trim().is_empty()).map(PathBuf::from).unwrap_or_else(||PathBuf::from(r"C:\CONIK"))}
fn dirs(r:&Path)->Result<(),LocalError>{for p in [r.join("data"),r.join("documents/students"),r.join("documents/teachers"),r.join("documents/admissions"),r.join("documents/administrative"),r.join("generated/bulletins"),r.join("generated/transcripts"),r.join("generated/certificates"),r.join("generated/receipts"),r.join("generated/reports"),r.join("backups/automatic"),r.join("backups/manual"),r.join("logs"),r.join("config")]{fs::create_dir_all(&p).map_err(|e|LocalError{code:"FILESYSTEM_ERROR".into(),message:e.to_string()})?;}Ok(())}
fn open_database()->Result<(Connection,PathBuf),LocalError>{let r=root();dirs(&r)?;let p=r.join("data/conik.db");let c=Connection::open(&p)?;c.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;c.execute_batch(MIGRATION_001)?;let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<2{c.execute_batch(MIGRATION_002)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<3{c.execute_batch(MIGRATION_003)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<4{c.execute_batch(MIGRATION_004)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<5{c.execute_batch(MIGRATION_005)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<6{c.execute_batch(MIGRATION_006)?;}let v:i64=c.query_row("SELECT COALESCE(MAX(version),0) FROM schema_migrations",[],|r|r.get(0))?;if v<7{c.execute_batch(MIGRATION_007)?;}Ok((c,p))}
fn ensure(state:&State<AppState>)->Result<PathBuf,LocalError>{let mut g=state.db.lock().map_err(|_|LocalError{code:"DB_LOCK_ERROR".into(),message:"Unable to acquire local database lock".into()})?;if g.is_none(){let(c,p)=open_database()?;*g=Some(c);return Ok(p)}Ok(root().join("data/conik.db"))}
fn lock<'a>(state:&'a State<'_,AppState>)->Result<std::sync::MutexGuard<'a,Option<Connection>>,LocalError>{state.db.lock().map_err(|_|LocalError{code:"DB_LOCK_ERROR".into(),message:"Unable to acquire local database lock".into()})}
#[tauri::command] pub fn initialize_local_runtime(state:State<AppState>)->Result<LocalRuntimeStatus,LocalError>{let p=ensure(&state)?;let g=lock(&state)?;let v=g.as_ref().and_then(|c|c.query_row("SELECT MAX(version) FROM schema_migrations",[],|r|r.get::<_,Option<i64>>(0)).ok().flatten());Ok(LocalRuntimeStatus{initialized:p.exists(),database_path:p.display().to_string(),root_path:root().display().to_string(),migration_version:v})}
#[tauri::command] pub fn get_local_runtime_status(state:State<AppState>)->Result<LocalRuntimeStatus,LocalError>{initialize_local_runtime(state)}
fn institution_row(r:&rusqlite::Row)->rusqlite::Result<LocalInstitution>{Ok(LocalInstitution{id:r.get(0)?,name:r.get(1)?,slug:r.get(2)?,country_code:r.get(3)?,timezone:r.get(4)?,address:r.get(5)?,city:r.get(6)?,phone:r.get(7)?,email:r.get(8)?,website:r.get(9)?,logo_path:r.get(10)?,academic_year_label:r.get(11)?,created_at:r.get(12)?,updated_at:r.get(13)?})}
fn user_row(r:&rusqlite::Row)->rusqlite::Result<LocalUser>{Ok(LocalUser{id:r.get(0)?,username:r.get(1)?,first_name:r.get(2)?,last_name:r.get(3)?,phone:r.get(4)?,role:r.get(5)?,active:r.get::<_,i64>(6)?==1,institution_id:r.get(7)?,created_at:r.get(8)?,updated_at:r.get(9)?})}
fn year_row(r:&rusqlite::Row)->rusqlite::Result<AcademicYear>{Ok(AcademicYear{id:r.get(0)?,institution_id:r.get(1)?,label:r.get(2)?,start_date:r.get(3)?,end_date:r.get(4)?,status:r.get(5)?,is_current:r.get::<_,i64>(6)?==1,created_at:r.get(7)?,updated_at:r.get(8)?})}
fn semester_row(r:&rusqlite::Row)->rusqlite::Result<Semester>{Ok(Semester{id:r.get(0)?,academic_year_id:r.get(1)?,name:r.get(2)?,code:r.get(3)?,start_date:r.get(4)?,end_date:r.get(5)?,sequence:r.get(6)?,status:r.get(7)?,created_at:r.get(8)?,updated_at:r.get(9)?})}
fn level_row(r:&rusqlite::Row)->rusqlite::Result<Level>{Ok(Level{id:r.get(0)?,institution_id:r.get(1)?,name:r.get(2)?,code:r.get(3)?,description:r.get(4)?,sequence:r.get(5)?,status:r.get(6)?,created_at:r.get(7)?,updated_at:r.get(8)?})}
fn department_row(r:&rusqlite::Row)->rusqlite::Result<Department>{Ok(Department{id:r.get(0)?,institution_id:r.get(1)?,name:r.get(2)?,code:r.get(3)?,description:r.get(4)?,status:r.get(5)?,created_at:r.get(6)?,updated_at:r.get(7)?})}
fn program_row(r:&rusqlite::Row)->rusqlite::Result<Program>{Ok(Program{id:r.get(0)?,institution_id:r.get(1)?,department_id:r.get(2)?,level_id:r.get(3)?,name:r.get(4)?,code:r.get(5)?,description:r.get(6)?,duration_years:r.get(7)?,status:r.get(8)?,created_at:r.get(9)?,updated_at:r.get(10)?})}
fn validate_dates(start:&str,end:&str)->Result<(),LocalError>{if start.trim().is_empty()||end.trim().is_empty()||start>=end{return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Start date must be before end date".into()})}Ok(())}
#[tauri::command] pub fn create_institution(state:State<AppState>,name:String,slug:String,country_code:Option<String>,timezone:Option<String>,address:Option<String>,city:Option<String>,phone:Option<String>,email:Option<String>,website:Option<String>,logo_path:Option<String>,academic_year_label:Option<String>)->Result<LocalInstitution,LocalError>{let n=name.trim();let s=slug.trim();if n.is_empty()||s.is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Institution name and slug are required".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();let id=Uuid::new_v4().to_string();let t=now();let cc=country_code.unwrap_or("TG".into());let tz=timezone.unwrap_or("Africa/Lome".into());c.execute("INSERT INTO institution(id,name,slug,country_code,timezone,address,city,phone,email,website,logo_path,academic_year_label,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",params![id,n,s,cc,tz,address,city,phone,email,website,logo_path,academic_year_label,t,t])?;c.execute("INSERT INTO institution_settings(institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at) VALUES(?,'XOF','fr-FR',?,?,?,?)",params![id,cc,tz,academic_year_label,t])?;c.query_row("SELECT id,name,slug,country_code,timezone,address,city,phone,email,website,logo_path,academic_year_label,created_at,updated_at FROM institution WHERE id=?",params![id],institution_row).map_err(Into::into)}
#[tauri::command] pub fn get_institution(state:State<AppState>,id:String)->Result<Option<LocalInstitution>,LocalError>{ensure(&state)?;let g=lock(&state)?;match g.as_ref().unwrap().query_row("SELECT id,name,slug,country_code,timezone,address,city,phone,email,website,logo_path,academic_year_label,created_at,updated_at FROM institution WHERE id=?",params![id],institution_row){Ok(v)=>Ok(Some(v)),Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(None),Err(e)=>Err(e.into())}}
#[tauri::command] pub fn bootstrap_local_admin(state:State<AppState>,institution_id:String,username:String,password:String,first_name:String,last_name:String,phone:Option<String>)->Result<LocalUser,LocalError>{let u=username.trim().to_lowercase();let f=first_name.trim();let l=last_name.trim();if institution_id.trim().is_empty()||u.is_empty()||password.len()<8||f.is_empty()||l.is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Institution, names, username and a password of at least 8 characters are required".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Institution not found".into()})}if c.query_row("SELECT 1 FROM local_users WHERE institution_id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_ok(){return Err(LocalError{code:"ADMIN_ALREADY_EXISTS".into(),message:"A local administrator already exists for this institution".into()})}if c.query_row("SELECT 1 FROM local_users WHERE username=?",params![u],|r|r.get::<_,i64>(0)).is_ok(){return Err(LocalError{code:"USERNAME_EXISTS".into(),message:"This username is already in use".into()})}let salt=SaltString::generate(&mut OsRng);let hash=Argon2::default().hash_password(password.as_bytes(),&salt).map_err(|e|LocalError{code:"PASSWORD_HASH_ERROR".into(),message:e.to_string()})?.to_string();let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO local_users(id,username,password_hash,first_name,last_name,phone,role,active,institution_id,created_at,updated_at) VALUES(?,?,?,?,?,?,'super_admin',1,?,?,?)",params![id,u,hash,f,l,phone,institution_id,t,t])?;c.query_row("SELECT id,username,first_name,last_name,phone,role,active,institution_id,created_at,updated_at FROM local_users WHERE id=?",params![id],user_row).map_err(Into::into)}
#[tauri::command] pub fn get_local_admin(state:State<AppState>,institution_id:String)->Result<Option<LocalUser>,LocalError>{ensure(&state)?;let g=lock(&state)?;match g.as_ref().unwrap().query_row("SELECT id,username,first_name,last_name,phone,role,active,institution_id,created_at,updated_at FROM local_users WHERE institution_id=? ORDER BY created_at LIMIT 1",params![institution_id],user_row){Ok(v)=>Ok(Some(v)),Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(None),Err(e)=>Err(e.into())}}
fn settings_row(r:&rusqlite::Row)->rusqlite::Result<InstitutionSettings>{Ok(InstitutionSettings{institution_id:r.get(0)?,currency_code:r.get(1)?,locale:r.get(2)?,country_code:r.get(3)?,timezone:r.get(4)?,academic_year_label:r.get(5)?,updated_at:r.get(6)?})}
#[tauri::command] pub fn get_institution_settings(state:State<AppState>,institution_id:String)->Result<Option<InstitutionSettings>,LocalError>{ensure(&state)?;let g=lock(&state)?;match g.as_ref().unwrap().query_row("SELECT institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at FROM institution_settings WHERE institution_id=?",params![institution_id],settings_row){Ok(v)=>Ok(Some(v)),Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(None),Err(e)=>Err(e.into())}}
#[tauri::command] pub fn update_institution_settings(state:State<AppState>,institution_id:String,currency_code:String,locale:String,country_code:String,timezone:String,academic_year_label:Option<String>)->Result<InstitutionSettings,LocalError>{if currency_code.trim().is_empty()||locale.trim().is_empty()||country_code.trim().is_empty()||timezone.trim().is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Currency, locale, country and timezone are required".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();let t=now();c.execute("INSERT INTO institution_settings(institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(institution_id) DO UPDATE SET currency_code=excluded.currency_code,locale=excluded.locale,country_code=excluded.country_code,timezone=excluded.timezone,academic_year_label=excluded.academic_year_label,updated_at=excluded.updated_at",params![institution_id,currency_code,locale,country_code,timezone,academic_year_label,t])?;c.query_row("SELECT institution_id,currency_code,locale,country_code,timezone,academic_year_label,updated_at FROM institution_settings WHERE institution_id=?",params![institution_id],settings_row).map_err(Into::into)}
#[tauri::command] pub fn create_academic_year(state:State<AppState>,institution_id:String,label:String,start_date:String,end_date:String,set_current:bool)->Result<AcademicYear,LocalError>{if label.trim().is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Academic year label is required".into()})}validate_dates(&start_date,&end_date)?;ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Institution not found".into()})}if set_current{c.execute("UPDATE academic_years_local SET is_current=0,status=CASE WHEN status='active' THEN 'planned' ELSE status END,updated_at=? WHERE institution_id=?",params![now(),institution_id])?;}let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO academic_years_local(id,institution_id,label,start_date,end_date,status,is_current,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",params![id,institution_id,label.trim(),start_date,end_date,if set_current{"active"}else{"planned"},if set_current{1}else{0},t,t])?;c.query_row("SELECT id,institution_id,label,start_date,end_date,status,is_current,created_at,updated_at FROM academic_years_local WHERE id=?",params![id],year_row).map_err(Into::into)}
#[tauri::command] pub fn list_academic_years(state:State<AppState>,institution_id:String)->Result<Vec<AcademicYear>,LocalError>{ensure(&state)?;let g=lock(&state)?;let mut st=g.as_ref().unwrap().prepare("SELECT id,institution_id,label,start_date,end_date,status,is_current,created_at,updated_at FROM academic_years_local WHERE institution_id=? ORDER BY start_date DESC")?;let rows=st.query_map(params![institution_id],year_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)}
#[tauri::command] pub fn set_current_academic_year(state:State<AppState>,institution_id:String,academic_year_id:String)->Result<AcademicYear,LocalError>{ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM academic_years_local WHERE id=? AND institution_id=?",params![academic_year_id,institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Academic year not found".into()})}let t=now();c.execute("UPDATE academic_years_local SET is_current=0,updated_at=? WHERE institution_id=?",params![t,institution_id])?;c.execute("UPDATE academic_years_local SET is_current=1,status='active',updated_at=? WHERE id=?",params![t,academic_year_id])?;c.query_row("SELECT id,institution_id,label,start_date,end_date,status,is_current,created_at,updated_at FROM academic_years_local WHERE id=?",params![academic_year_id],year_row).map_err(Into::into)}
#[tauri::command] pub fn create_semester(state:State<AppState>,academic_year_id:String,name:String,code:String,start_date:String,end_date:String,sequence:i64)->Result<Semester,LocalError>{if name.trim().is_empty()||code.trim().is_empty()||sequence<1{return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Semester name, code and a positive sequence are required".into()})}validate_dates(&start_date,&end_date)?;ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM academic_years_local WHERE id=?",params![academic_year_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Academic year not found".into()})}let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO semesters_local(id,academic_year_id,name,code,start_date,end_date,sequence,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'planned',?,?)",params![id,academic_year_id,name.trim(),code.trim(),start_date,end_date,sequence,t,t])?;c.query_row("SELECT id,academic_year_id,name,code,start_date,end_date,sequence,status,created_at,updated_at FROM semesters_local WHERE id=?",params![id],semester_row).map_err(Into::into)}
#[tauri::command] pub fn list_semesters(state:State<AppState>,academic_year_id:String)->Result<Vec<Semester>,LocalError>{ensure(&state)?;let g=lock(&state)?;let mut st=g.as_ref().unwrap().prepare("SELECT id,academic_year_id,name,code,start_date,end_date,sequence,status,created_at,updated_at FROM semesters_local WHERE academic_year_id=? ORDER BY sequence")?;let rows=st.query_map(params![academic_year_id],semester_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)}
#[tauri::command] pub fn create_level(state:State<AppState>,institution_id:String,name:String,code:String,description:Option<String>,sequence:i64)->Result<Level,LocalError>{let n=name.trim();let cde=code.trim();if institution_id.trim().is_empty()||n.is_empty()||cde.is_empty()||sequence<1{return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Institution, level name, code and a positive sequence are required".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Institution not found".into()})}let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO levels_local(id,institution_id,name,code,description,sequence,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'active',?,?)",params![id,institution_id,n,cde,description,sequence,t,t])?;c.query_row("SELECT id,institution_id,name,code,description,sequence,status,created_at,updated_at FROM levels_local WHERE id=?",params![id],level_row).map_err(Into::into)}
#[tauri::command] pub fn list_levels(state:State<AppState>,institution_id:String)->Result<Vec<Level>,LocalError>{ensure(&state)?;let g=lock(&state)?;let mut st=g.as_ref().unwrap().prepare("SELECT id,institution_id,name,code,description,sequence,status,created_at,updated_at FROM levels_local WHERE institution_id=? ORDER BY sequence,name")?;let rows=st.query_map(params![institution_id],level_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)}
#[tauri::command] pub fn create_department(state:State<AppState>,institution_id:String,name:String,code:String,description:Option<String>)->Result<Department,LocalError>{let n=name.trim();let cde=code.trim();if institution_id.trim().is_empty()||n.is_empty()||cde.is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Institution, department name and code are required".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Institution not found".into()})}let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO departments_local(id,institution_id,name,code,description,status,created_at,updated_at) VALUES(?,?,?,?,?,'active',?,?)",params![id,institution_id,n,cde,description,t,t])?;c.query_row("SELECT id,institution_id,name,code,description,status,created_at,updated_at FROM departments_local WHERE id=?",params![id],department_row).map_err(Into::into)}
#[tauri::command] pub fn list_departments(state:State<AppState>,institution_id:String)->Result<Vec<Department>,LocalError>{ensure(&state)?;let g=lock(&state)?;let mut st=g.as_ref().unwrap().prepare("SELECT id,institution_id,name,code,description,status,created_at,updated_at FROM departments_local WHERE institution_id=? ORDER BY name")?;let rows=st.query_map(params![institution_id],department_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)}
#[tauri::command] pub fn create_program(state:State<AppState>,institution_id:String,department_id:Option<String>,level_id:Option<String>,name:String,code:String,description:Option<String>,duration_years:Option<i64>)->Result<Program,LocalError>{let n=name.trim();let cde=code.trim();if institution_id.trim().is_empty()||n.is_empty()||cde.is_empty(){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Institution, program name and code are required".into()})}if duration_years.is_some_and(|v|v<1||v>10){return Err(LocalError{code:"VALIDATION_ERROR".into(),message:"Duration must be between 1 and 10 years".into()})}ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"NOT_FOUND".into(),message:"Institution not found".into()})}if let Some(ref d)=department_id{if c.query_row("SELECT 1 FROM departments_local WHERE id=? AND institution_id=?",params![d,institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"INVALID_DEPARTMENT".into(),message:"Department does not belong to this institution".into()})}}if let Some(ref l)=level_id{if c.query_row("SELECT 1 FROM levels_local WHERE id=? AND institution_id=?",params![l,institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(LocalError{code:"INVALID_LEVEL".into(),message:"Level does not belong to this institution".into()})}}let id=Uuid::new_v4().to_string();let t=now();c.execute("INSERT INTO programs_local(id,institution_id,department_id,level_id,name,code,description,duration_years,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'active',?,?)",params![id,institution_id,department_id,level_id,n,cde,description,duration_years,t,t])?;c.query_row("SELECT id,institution_id,department_id,level_id,name,code,description,duration_years,status,created_at,updated_at FROM programs_local WHERE id=?",params![id],program_row).map_err(Into::into)}
#[tauri::command] pub fn list_programs(state:State<AppState>,institution_id:String)->Result<Vec<Program>,LocalError>{ensure(&state)?;let g=lock(&state)?;let mut st=g.as_ref().unwrap().prepare("SELECT id,institution_id,department_id,level_id,name,code,description,duration_years,status,created_at,updated_at FROM programs_local WHERE institution_id=? ORDER BY name")?;let rows=st.query_map(params![institution_id],program_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)}

// ---------------------------------------------------------------------------
// ARCH-2G — Subjects (matières) and class groups (classes / groupes)
// ---------------------------------------------------------------------------
#[derive(Debug,Serialize)] pub struct Subject { pub id:String,pub institution_id:String,pub department_id:Option<String>,pub program_id:Option<String>,pub name:String,pub code:String,pub description:Option<String>,pub credit_hours:Option<f64>,pub coefficient:Option<f64>,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct ClassGroup { pub id:String,pub institution_id:String,pub program_id:Option<String>,pub level_id:Option<String>,pub academic_year_id:Option<String>,pub name:String,pub code:String,pub capacity:Option<i64>,pub room_label:Option<String>,pub status:String,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Student { pub id:String,pub institution_id:String,pub student_number:String,pub first_name:String,pub last_name:String,pub gender:Option<String>,pub birth_date:Option<String>,pub birth_place:Option<String>,pub nationality:Option<String>,pub phone:Option<String>,pub email:Option<String>,pub address:Option<String>,pub city:Option<String>,pub guardian_name:Option<String>,pub guardian_phone:Option<String>,pub guardian_email:Option<String>,pub status:String,pub photo_path:Option<String>,pub created_at:String,pub updated_at:String }
#[derive(Debug,Serialize)] pub struct Enrollment { pub id:String,pub student_id:String,pub institution_id:String,pub academic_year_id:String,pub program_id:Option<String>,pub level_id:Option<String>,pub class_group_id:Option<String>,pub enrollment_date:String,pub status:String,pub notes:Option<String>,pub created_at:String,pub updated_at:String }

fn verr(code:&str,message:&str)->LocalError{LocalError{code:code.into(),message:message.into()}}
fn clean(v:Option<String>)->Option<String>{v.map(|s|s.trim().to_string()).filter(|s|!s.is_empty())}
fn belongs(c:&Connection,table:&str,id:&Option<String>,institution_id:&str,code:&str,msg:&str)->Result<(),LocalError>{
  if let Some(x)=id{
    let sql=format!("SELECT 1 FROM {table} WHERE id=? AND institution_id=?");
    if c.query_row(&sql,params![x,institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(verr(code,msg))}
  }
  Ok(())
}
fn institution_exists(c:&Connection,institution_id:&str)->Result<(),LocalError>{
  if c.query_row("SELECT 1 FROM institution WHERE id=?",params![institution_id],|r|r.get::<_,i64>(0)).is_err(){return Err(verr("NOT_FOUND","Institution not found"))}
  Ok(())
}

const SUBJECT_COLS:&str="id,institution_id,department_id,program_id,name,code,description,credit_hours,coefficient,status,created_at,updated_at";
fn subject_row(r:&rusqlite::Row)->rusqlite::Result<Subject>{Ok(Subject{id:r.get(0)?,institution_id:r.get(1)?,department_id:r.get(2)?,program_id:r.get(3)?,name:r.get(4)?,code:r.get(5)?,description:r.get(6)?,credit_hours:r.get(7)?,coefficient:r.get(8)?,status:r.get(9)?,created_at:r.get(10)?,updated_at:r.get(11)?})}
const CLASS_COLS:&str="id,institution_id,program_id,level_id,academic_year_id,name,code,capacity,room_label,status,created_at,updated_at";
fn class_row(r:&rusqlite::Row)->rusqlite::Result<ClassGroup>{Ok(ClassGroup{id:r.get(0)?,institution_id:r.get(1)?,program_id:r.get(2)?,level_id:r.get(3)?,academic_year_id:r.get(4)?,name:r.get(5)?,code:r.get(6)?,capacity:r.get(7)?,room_label:r.get(8)?,status:r.get(9)?,created_at:r.get(10)?,updated_at:r.get(11)?})}
const STUDENT_COLS:&str="id,institution_id,student_number,first_name,last_name,gender,birth_date,birth_place,nationality,phone,email,address,city,guardian_name,guardian_phone,guardian_email,status,photo_path,created_at,updated_at";
fn student_row(r:&rusqlite::Row)->rusqlite::Result<Student>{Ok(Student{id:r.get(0)?,institution_id:r.get(1)?,student_number:r.get(2)?,first_name:r.get(3)?,last_name:r.get(4)?,gender:r.get(5)?,birth_date:r.get(6)?,birth_place:r.get(7)?,nationality:r.get(8)?,phone:r.get(9)?,email:r.get(10)?,address:r.get(11)?,city:r.get(12)?,guardian_name:r.get(13)?,guardian_phone:r.get(14)?,guardian_email:r.get(15)?,status:r.get(16)?,photo_path:r.get(17)?,created_at:r.get(18)?,updated_at:r.get(19)?})}
const ENROLLMENT_COLS:&str="id,student_id,institution_id,academic_year_id,program_id,level_id,class_group_id,enrollment_date,status,notes,created_at,updated_at";
fn enrollment_row(r:&rusqlite::Row)->rusqlite::Result<Enrollment>{Ok(Enrollment{id:r.get(0)?,student_id:r.get(1)?,institution_id:r.get(2)?,academic_year_id:r.get(3)?,program_id:r.get(4)?,level_id:r.get(5)?,class_group_id:r.get(6)?,enrollment_date:r.get(7)?,status:r.get(8)?,notes:r.get(9)?,created_at:r.get(10)?,updated_at:r.get(11)?})}

fn unique_err(e:rusqlite::Error,msg:&str)->LocalError{
  if let rusqlite::Error::SqliteFailure(ref f,_)=e{ if f.code==rusqlite::ErrorCode::ConstraintViolation { return verr("DUPLICATE",msg) } }
  e.into()
}

#[tauri::command] pub fn create_subject(state:State<AppState>,institution_id:String,department_id:Option<String>,program_id:Option<String>,name:String,code:String,description:Option<String>,credit_hours:Option<f64>,coefficient:Option<f64>)->Result<Subject,LocalError>{
  let n=name.trim();let cde=code.trim();
  if institution_id.trim().is_empty()||n.is_empty()||cde.is_empty(){return Err(verr("VALIDATION_ERROR","Institution, subject name and code are required"))}
  if coefficient.is_some_and(|v|v<=0.0||v>100.0){return Err(verr("VALIDATION_ERROR","Coefficient must be between 0 and 100"))}
  if credit_hours.is_some_and(|v|v<0.0){return Err(verr("VALIDATION_ERROR","Credit hours cannot be negative"))}
  let department_id=clean(department_id);let program_id=clean(program_id);
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  institution_exists(c,&institution_id)?;
  belongs(c,"departments_local",&department_id,&institution_id,"INVALID_DEPARTMENT","Department does not belong to this institution")?;
  belongs(c,"programs_local",&program_id,&institution_id,"INVALID_PROGRAM","Program does not belong to this institution")?;
  let id=Uuid::new_v4().to_string();let t=now();
  c.execute("INSERT INTO subjects_local(id,institution_id,department_id,program_id,name,code,description,credit_hours,coefficient,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,'active',?,?)",params![id,institution_id,department_id,program_id,n,cde,clean(description),credit_hours,coefficient.unwrap_or(1.0),t,t]).map_err(|e|unique_err(e,"A subject with this name or code already exists"))?;
  c.query_row(&format!("SELECT {SUBJECT_COLS} FROM subjects_local WHERE id=?"),params![id],subject_row).map_err(Into::into)
}
#[tauri::command] pub fn list_subjects(state:State<AppState>,institution_id:String)->Result<Vec<Subject>,LocalError>{
  ensure(&state)?;let g=lock(&state)?;
  let mut st=g.as_ref().unwrap().prepare(&format!("SELECT {SUBJECT_COLS} FROM subjects_local WHERE institution_id=? ORDER BY name"))?;
  let rows=st.query_map(params![institution_id],subject_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)
}

#[tauri::command] pub fn create_class_group(state:State<AppState>,institution_id:String,program_id:Option<String>,level_id:Option<String>,academic_year_id:Option<String>,name:String,code:String,capacity:Option<i64>,room_label:Option<String>)->Result<ClassGroup,LocalError>{
  let n=name.trim();let cde=code.trim();
  if institution_id.trim().is_empty()||n.is_empty()||cde.is_empty(){return Err(verr("VALIDATION_ERROR","Institution, class name and code are required"))}
  if capacity.is_some_and(|v|v<1||v>2000){return Err(verr("VALIDATION_ERROR","Capacity must be between 1 and 2000"))}
  let program_id=clean(program_id);let level_id=clean(level_id);let academic_year_id=clean(academic_year_id);
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  institution_exists(c,&institution_id)?;
  belongs(c,"programs_local",&program_id,&institution_id,"INVALID_PROGRAM","Program does not belong to this institution")?;
  belongs(c,"levels_local",&level_id,&institution_id,"INVALID_LEVEL","Level does not belong to this institution")?;
  belongs(c,"academic_years_local",&academic_year_id,&institution_id,"INVALID_ACADEMIC_YEAR","Academic year does not belong to this institution")?;
  let id=Uuid::new_v4().to_string();let t=now();
  c.execute("INSERT INTO class_groups_local(id,institution_id,program_id,level_id,academic_year_id,name,code,capacity,room_label,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,'active',?,?)",params![id,institution_id,program_id,level_id,academic_year_id,n,cde,capacity,clean(room_label),t,t]).map_err(|e|unique_err(e,"A class with this name or code already exists for this year"))?;
  c.query_row(&format!("SELECT {CLASS_COLS} FROM class_groups_local WHERE id=?"),params![id],class_row).map_err(Into::into)
}
#[tauri::command] pub fn list_class_groups(state:State<AppState>,institution_id:String)->Result<Vec<ClassGroup>,LocalError>{
  ensure(&state)?;let g=lock(&state)?;
  let mut st=g.as_ref().unwrap().prepare(&format!("SELECT {CLASS_COLS} FROM class_groups_local WHERE institution_id=? ORDER BY name"))?;
  let rows=st.query_map(params![institution_id],class_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)
}

// ---------------------------------------------------------------------------
// ARCH-2H — Students and enrollments
// ---------------------------------------------------------------------------
fn check_gender(g:&Option<String>)->Result<(),LocalError>{ if let Some(v)=g{ if !["M","F","O"].contains(&v.as_str()){return Err(verr("VALIDATION_ERROR","Gender must be M, F or O"))} } Ok(()) }
const STUDENT_STATUSES:[&str;5]=["active","inactive","graduated","transferred","suspended"];

#[tauri::command] pub fn create_student(state:State<AppState>,institution_id:String,student_number:String,first_name:String,last_name:String,gender:Option<String>,birth_date:Option<String>,birth_place:Option<String>,nationality:Option<String>,phone:Option<String>,email:Option<String>,address:Option<String>,city:Option<String>,guardian_name:Option<String>,guardian_phone:Option<String>,guardian_email:Option<String>,photo_path:Option<String>)->Result<Student,LocalError>{
  let num=student_number.trim();let f=first_name.trim();let l=last_name.trim();
  if institution_id.trim().is_empty()||num.is_empty()||f.is_empty()||l.is_empty(){return Err(verr("VALIDATION_ERROR","Institution, student number, first name and last name are required"))}
  let gender=clean(gender);check_gender(&gender)?;
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  institution_exists(c,&institution_id)?;
  let id=Uuid::new_v4().to_string();let t=now();
  c.execute(&format!("INSERT INTO students_local({STUDENT_COLS}) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?,?,?)"),params![id,institution_id,num,f,l,gender,clean(birth_date),clean(birth_place),clean(nationality),clean(phone),clean(email),clean(address),clean(city),clean(guardian_name),clean(guardian_phone),clean(guardian_email),clean(photo_path),t,t]).map_err(|e|unique_err(e,"This student number is already used"))?;
  c.query_row(&format!("SELECT {STUDENT_COLS} FROM students_local WHERE id=?"),params![id],student_row).map_err(Into::into)
}
#[tauri::command] pub fn list_students(state:State<AppState>,institution_id:String)->Result<Vec<Student>,LocalError>{
  ensure(&state)?;let g=lock(&state)?;
  let mut st=g.as_ref().unwrap().prepare(&format!("SELECT {STUDENT_COLS} FROM students_local WHERE institution_id=? ORDER BY last_name,first_name"))?;
  let rows=st.query_map(params![institution_id],student_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)
}
#[tauri::command] pub fn get_student(state:State<AppState>,id:String)->Result<Option<Student>,LocalError>{
  ensure(&state)?;let g=lock(&state)?;
  match g.as_ref().unwrap().query_row(&format!("SELECT {STUDENT_COLS} FROM students_local WHERE id=?"),params![id],student_row){
    Ok(s)=>Ok(Some(s)),Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(None),Err(e)=>Err(e.into())
  }
}
/// Partial update: a field left as `None` is kept, an empty string clears an optional field.
#[tauri::command] pub fn update_student(state:State<AppState>,id:String,first_name:Option<String>,last_name:Option<String>,gender:Option<String>,birth_date:Option<String>,birth_place:Option<String>,nationality:Option<String>,phone:Option<String>,email:Option<String>,address:Option<String>,city:Option<String>,guardian_name:Option<String>,guardian_phone:Option<String>,guardian_email:Option<String>,status:Option<String>,photo_path:Option<String>)->Result<Student,LocalError>{
  if let Some(ref v)=first_name{if v.trim().is_empty(){return Err(verr("VALIDATION_ERROR","First name cannot be empty"))}}
  if let Some(ref v)=last_name{if v.trim().is_empty(){return Err(verr("VALIDATION_ERROR","Last name cannot be empty"))}}
  if let Some(ref v)=status{if !STUDENT_STATUSES.contains(&v.as_str()){return Err(verr("VALIDATION_ERROR","Invalid student status"))}}
  if let Some(ref v)=gender{if !v.trim().is_empty(){check_gender(&Some(v.trim().to_string()))?}}
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  let cur=match c.query_row(&format!("SELECT {STUDENT_COLS} FROM students_local WHERE id=?"),params![id],student_row){Ok(s)=>s,Err(rusqlite::Error::QueryReturnedNoRows)=>return Err(verr("NOT_FOUND","Student not found")),Err(e)=>return Err(e.into())};
  let opt=|new:Option<String>,old:Option<String>|->Option<String>{match new{Some(v)=>clean(Some(v)),None=>old}};
  let t=now();
  c.execute("UPDATE students_local SET first_name=?,last_name=?,gender=?,birth_date=?,birth_place=?,nationality=?,phone=?,email=?,address=?,city=?,guardian_name=?,guardian_phone=?,guardian_email=?,status=?,photo_path=?,updated_at=? WHERE id=?",params![
    first_name.map(|v|v.trim().to_string()).unwrap_or(cur.first_name),
    last_name.map(|v|v.trim().to_string()).unwrap_or(cur.last_name),
    opt(gender,cur.gender),opt(birth_date,cur.birth_date),opt(birth_place,cur.birth_place),opt(nationality,cur.nationality),
    opt(phone,cur.phone),opt(email,cur.email),opt(address,cur.address),opt(city,cur.city),
    opt(guardian_name,cur.guardian_name),opt(guardian_phone,cur.guardian_phone),opt(guardian_email,cur.guardian_email),
    status.unwrap_or(cur.status),opt(photo_path,cur.photo_path),t,id])?;
  c.query_row(&format!("SELECT {STUDENT_COLS} FROM students_local WHERE id=?"),params![id],student_row).map_err(Into::into)
}

#[tauri::command] pub fn create_enrollment(state:State<AppState>,student_id:String,institution_id:String,academic_year_id:String,program_id:Option<String>,level_id:Option<String>,class_group_id:Option<String>,enrollment_date:String,notes:Option<String>)->Result<Enrollment,LocalError>{
  if student_id.trim().is_empty()||institution_id.trim().is_empty()||academic_year_id.trim().is_empty()||enrollment_date.trim().is_empty(){return Err(verr("VALIDATION_ERROR","Student, institution, academic year and enrollment date are required"))}
  let program_id=clean(program_id);let level_id=clean(level_id);let class_group_id=clean(class_group_id);
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  institution_exists(c,&institution_id)?;
  belongs(c,"students_local",&Some(student_id.clone()),&institution_id,"INVALID_STUDENT","Student does not belong to this institution")?;
  belongs(c,"academic_years_local",&Some(academic_year_id.clone()),&institution_id,"INVALID_ACADEMIC_YEAR","Academic year does not belong to this institution")?;
  belongs(c,"programs_local",&program_id,&institution_id,"INVALID_PROGRAM","Program does not belong to this institution")?;
  belongs(c,"levels_local",&level_id,&institution_id,"INVALID_LEVEL","Level does not belong to this institution")?;
  belongs(c,"class_groups_local",&class_group_id,&institution_id,"INVALID_CLASS","Class does not belong to this institution")?;
  let id=Uuid::new_v4().to_string();let t=now();
  c.execute(&format!("INSERT INTO enrollments_local({ENROLLMENT_COLS}) VALUES(?,?,?,?,?,?,?,?,'active',?,?,?)"),params![id,student_id,institution_id,academic_year_id,program_id,level_id,class_group_id,enrollment_date.trim(),clean(notes),t,t]).map_err(|e|unique_err(e,"This student is already enrolled for this academic year"))?;
  c.query_row(&format!("SELECT {ENROLLMENT_COLS} FROM enrollments_local WHERE id=?"),params![id],enrollment_row).map_err(Into::into)
}
#[tauri::command] pub fn list_enrollments(state:State<AppState>,institution_id:String,academic_year_id:Option<String>)->Result<Vec<Enrollment>,LocalError>{
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  let year=clean(academic_year_id);
  let mut st=c.prepare(&format!("SELECT {ENROLLMENT_COLS} FROM enrollments_local WHERE institution_id=?1 AND (?2 IS NULL OR academic_year_id=?2) ORDER BY enrollment_date DESC"))?;
  let rows=st.query_map(params![institution_id,year],enrollment_row)?;Ok(rows.collect::<Result<Vec<_>,_>>()?)
}
#[tauri::command] pub fn assign_enrollment_to_class(state:State<AppState>,enrollment_id:String,class_group_id:String)->Result<Enrollment,LocalError>{
  ensure(&state)?;let g=lock(&state)?;let c=g.as_ref().unwrap();
  let e=match c.query_row(&format!("SELECT {ENROLLMENT_COLS} FROM enrollments_local WHERE id=?"),params![enrollment_id],enrollment_row){Ok(e)=>e,Err(rusqlite::Error::QueryReturnedNoRows)=>return Err(verr("NOT_FOUND","Enrollment not found")),Err(x)=>return Err(x.into())};
  let class_year:Option<String>=match c.query_row("SELECT academic_year_id FROM class_groups_local WHERE id=? AND institution_id=?",params![class_group_id,e.institution_id],|r|r.get(0)){Ok(v)=>v,Err(_)=>return Err(verr("INVALID_CLASS","Class does not belong to this institution"))};
  if class_year.as_deref().is_some_and(|y|y!=e.academic_year_id){return Err(verr("YEAR_MISMATCH","Class belongs to a different academic year"))}
  let cap:Option<i64>=c.query_row("SELECT capacity FROM class_groups_local WHERE id=?",params![class_group_id],|r|r.get(0))?;
  if let Some(cap)=cap{
    let n:i64=c.query_row("SELECT COUNT(*) FROM enrollments_local WHERE class_group_id=? AND status='active' AND id<>?",params![class_group_id,enrollment_id],|r|r.get(0))?;
    if n>=cap{return Err(verr("CLASS_FULL","This class has reached its capacity"))}
  }
  c.execute("UPDATE enrollments_local SET class_group_id=?,updated_at=? WHERE id=?",params![class_group_id,now(),enrollment_id])?;
  c.query_row(&format!("SELECT {ENROLLMENT_COLS} FROM enrollments_local WHERE id=?"),params![enrollment_id],enrollment_row).map_err(Into::into)
}

pub fn run(){tauri::Builder::default().manage(AppState{db:Mutex::new(None)}).invoke_handler(tauri::generate_handler![
  initialize_local_runtime,get_local_runtime_status,create_institution,get_institution,bootstrap_local_admin,get_local_admin,
  get_institution_settings,update_institution_settings,create_academic_year,list_academic_years,set_current_academic_year,
  create_semester,list_semesters,create_level,list_levels,create_department,list_departments,create_program,list_programs,
  create_subject,list_subjects,create_class_group,list_class_groups,
  create_student,list_students,get_student,update_student,
  create_enrollment,list_enrollments,assign_enrollment_to_class
]).run(tauri::generate_context!()).expect("error while running CONIK desktop application");}
