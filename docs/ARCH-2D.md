# ARCH-2D — Local administrator bootstrap & institution settings

## Implemented

- Added SQLite migration 002 for institution ownership of local users.
- Added `institution_settings` for local currency, locale, country, timezone and academic year label.
- Added secure Argon2 password hashing in the Tauri/Rust runtime.
- Added local Super Administrator bootstrap with duplicate-admin and duplicate-username protection.
- Added IPC commands to read the local administrator and institution settings.
- Added IPC command to update institution settings.
- Extended desktop onboarding so first configuration creates the institution, local Super Administrator and local settings in SQLite.
- Existing web/Supabase onboarding remains intact.
- Migration execution is version-aware so migration 002 is not re-applied on every application restart.

## First-launch flow

1. Initialize local runtime.
2. Create institution in `C:\CONIK\data\conik.db`.
3. Create the local `super_admin` account with an Argon2 password hash.
4. Save local settings (XOF, fr-FR, TG, Africa/Lome and academic year by default).
5. Keep the institution ID as the local UI pointer.
6. On the next launch, reload institution, administrator and settings from SQLite.

## Security rules

- Passwords are never stored in plaintext.
- Desktop operational data does not require Supabase connectivity.
- SQLite remains behind the native Tauri boundary; the web UI does not open the database file directly.

## Validation still required

The implementation is committed, but final compilation and restart testing must be performed in the Windows/Tauri environment before calling the desktop runtime production-ready.
