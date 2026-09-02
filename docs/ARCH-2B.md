# ARCH-2B — Native Windows runtime foundation

## Implemented

ARCH-2B establishes the first native runtime layer for CONIK without replacing the existing Next.js application.

### Desktop shell

- Tauri 2 configuration under `apps/desktop/src-tauri`.
- Windows bundle targets prepared for NSIS and MSI.
- Existing React application remains the frontend entry point.
- Development command: `pnpm desktop:dev`.
- Production desktop command: `pnpm desktop:build`.

### Native SQLite

- SQLite is provided by Rust through `rusqlite` with the bundled SQLite library.
- The database is created at `C:\CONIK\data\conik.db` on Windows.
- `CONIK_DATA_ROOT` may override the root during automated tests.
- SQLite WAL mode and foreign-key enforcement are enabled.
- Migration `001_initial_platform.sql` is embedded into the native binary and applied during initialization.

### Managed filesystem

The runtime creates the required local directories for documents, generated files, backups, logs and configuration automatically. The renderer does not manipulate these paths directly.

### Secure IPC boundary

The frontend receives a small typed bridge in `apps/web/lib/local/tauri.ts`. The first native commands are:

- `initialize_local_runtime`
- `get_local_runtime_status`
- `create_institution`
- `get_institution`

The database connection remains inside the native process.

### Persistence verification

An integration test verifies the critical first persistence invariant:

`open database → apply migration → write institution → close → reopen → read institution`

The persisted institution and migration version must remain available after reopening the SQLite file.

## Important limitation

ARCH-2B creates the native foundation; it does not yet migrate the existing onboarding UI to local persistence. That is the next integration step. The existing Supabase-backed application remains intact during the migration.
