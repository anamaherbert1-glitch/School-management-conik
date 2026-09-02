# ARCH-2E — Academic year and semesters

Implemented the next offline operational foundation after institution onboarding.

## Local SQLite

Migration `003_academic_years_semesters` adds:

- `academic_years_local`: institution, label, start/end dates, lifecycle status and one current-year flag per institution.
- `semesters_local`: year, name, code, sequence, dates and lifecycle status.
- Referential integrity and indexes.

## Native services

Tauri exposes commands to:

- create an academic year;
- list academic years for an institution;
- set the current academic year;
- create a semester;
- list semesters for an academic year.

Dates are validated so the start date must precede the end date. Setting a year as current automatically removes the current flag from the previous year.

## React bridge

`apps/web/lib/local/tauri.ts` now exposes typed methods for the academic-year and semester commands while retaining all previous institution/admin/settings methods.

## Scope

No existing Supabase/web workflow was removed. The desktop path is local-first; the existing web path remains available during the migration.

## Validation gate

The Rust/Tauri runtime still requires an actual Windows build/run test before production release. The code is prepared for that validation, not presented as a finished Windows installer.
