# CONIK School Management — Master Architecture

## Target

CONIK is evolving from the existing Next.js/Supabase application into an offline-first Windows school-management product. This is an incremental migration: existing useful pages, components, business rules and data structures remain available while operational persistence moves progressively to a local relational database.

## Runtime architecture

```text
CONIK Desktop (Windows)
├── Desktop shell (Tauri preferred after compatibility validation)
├── Existing React/Next UI (reused progressively)
├── Local application services
├── Local API / IPC boundary
├── SQLite operational database
├── Local document storage
├── Local PDF/document generation
├── Local backup/restore service
└── Offline license state
          │
          └── Internet only when required
                ├── Central license service
                ├── Subscription/billing service
                ├── Software update service
                └── Optional future synchronization
```

## Data ownership

### Local operational data

Students, teachers, admissions, enrollments, departments, programs, levels, classes, groups, rooms, subjects, curricula, grades, exams, schedules, fees, payments, receipts, documents, reports, school settings, audit logs and generated documents belong to the local school database.

### Central CONIK data

Licenses, plans, subscriptions, activation/device records, commercial billing state, software release metadata and central license audit events remain server-side.

Supabase is therefore retained where it provides value for central CONIK services; it is not the required operational database for normal school work.

## Local filesystem contract

```text
C:\CONIK\
├── data\
│   └── conik.db
├── documents\
│   ├── students\
│   ├── teachers\
│   ├── admissions\
│   └── administrative\
├── generated\
│   ├── bulletins\
│   ├── transcripts\
│   ├── certificates\
│   ├── receipts\
│   └── reports\
├── backups\
│   ├── automatic\
│   └── manual\
├── logs\
└── config\
```

The application, not the user, owns the lifecycle of these paths.

## Migration rules

1. Never delete a working feature solely to migrate storage.
2. Do not make the UI claim a successful save before durable persistence succeeds.
3. Introduce a local repository/service layer before changing every page.
4. Keep business calculations independent from React components.
5. Keep PDF generation local.
6. Keep secrets out of the desktop client.
7. Version all local database migrations.
8. Provide backup before destructive restore operations.
9. Preserve existing Supabase support during the transition where required by the current application.
10. Test every migrated module offline before declaring it complete.

## Security boundaries

The React renderer must not receive database credentials, Supabase service-role credentials, payment-provider secrets or license-signing secrets. Desktop privileged operations must cross a narrow IPC/service boundary with explicit validation and authorization.

## LAN mode

For multi-computer schools, the recommended topology is one Windows machine hosting the local CONIK service and database, with other authorized computers connecting over the school LAN. SQLite is the operational store, but concurrent access must be mediated by the local service rather than exposing the database file directly over a network share.

## Phased implementation

### Phase 0 — Foundation and audit
- Freeze the current useful feature set.
- Inventory routes, components, Supabase calls and current tables.
- Establish the local data/service interfaces.
- Add architecture and migration documentation.

### Phase 1 — Desktop shell
- Add the Windows desktop shell around the reusable UI.
- Establish secure IPC and application data directories.
- Keep the existing web build available during migration.

### Phase 2 — Local database
- Introduce SQLite and versioned migrations.
- Build repository interfaces.
- Implement institution/onboarding persistence locally.

### Phase 3 — Operational migration
- Migrate modules incrementally: institution/configuration → students → admissions → academic structure → teachers → grades/exams → timetable → finance → documents/reports.
- Keep central licensing separate.

### Phase 4 — Reliability
- Backup/restore, audit logs, recovery checks, offline testing, LAN testing and data-integrity tests.

### Phase 5 — Commercial services
- License activation, signed offline token, grace period, device management, subscriptions and updates.

### Phase 6 — Installer and release
- Windows installer, first-launch onboarding, migrations, upgrade preservation and production QA.

## Current baseline

The repository currently contains a Next.js web application under `apps/web`, with Supabase dependencies in the workspace. This architecture intentionally keeps that application as the reusable UI/business-logic starting point instead of replacing it wholesale.
