# ARCH-2C — Local onboarding integration

## Implemented

The existing onboarding screen now has two execution paths:

- **Web browser:** existing Supabase onboarding remains unchanged.
- **CONIK desktop:** institution creation uses the native Tauri/SQLite runtime and does not require Supabase.

### Desktop flow

1. The onboarding page detects the Tauri runtime.
2. The local runtime is initialized before the form becomes active.
3. Institution data is sent through the typed local bridge.
4. Rust persists the institution in `C:\CONIK\data\conik.db`.
5. The institution ID is retained by the desktop WebView as the local active-institution pointer.
6. On reopening the application, the onboarding page retrieves that ID and reloads the institution from SQLite.
7. The form is repopulated from the persisted local record.

### Preserved behavior

The public/web version still uses the existing Supabase RPC. No existing web onboarding path was removed.

### Offline boundary

The desktop onboarding path does not call Supabase for institution creation or recovery. SQLite remains behind the native IPC boundary.

### Acceptance scenario

`open CONIK → initialize SQLite → create institution → close application → reopen CONIK → recover institution from SQLite`

The final Windows-machine acceptance test remains to be executed on a Windows development environment because this repository integration cannot itself launch the desktop binary.
