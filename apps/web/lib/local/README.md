# Local platform boundary

This directory defines the application-facing contracts for the offline CONIK runtime.

Rules:

- React components must not access SQLite directly.
- React components must not manipulate `C:\CONIK` directly.
- Desktop/native code will provide the concrete implementations.
- Operational school data must not require Supabase for normal offline use.
- Central licensing/billing remains a separate concern.
- The existing Supabase implementation is preserved during migration until each module has a local replacement.

The first contracts cover institution and local user persistence. Later ARCH phases will add students, admissions, academics, finance, documents, backups, audit and other repositories.
