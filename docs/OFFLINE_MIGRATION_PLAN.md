# CONIK Offline Migration Plan

This plan is the implementation checklist for the master architecture.

## A. Inventory before migration

- [x] Confirm current repository structure.
- [x] Confirm `apps/web` is the existing application entry point.
- [x] Confirm the workspace currently uses Next.js/React and Supabase.
- [ ] Inventory every Supabase query and mutation by module.
- [ ] Map every existing table to its local SQLite counterpart.
- [ ] Identify pages that already contain reusable business logic.

## B. Local platform foundation

- [ ] Create a local application service package.
- [ ] Define typed repository interfaces.
- [ ] Add SQLite driver through the desktop/native layer.
- [ ] Add versioned SQLite migrations.
- [ ] Add application data-directory resolver for Windows.
- [ ] Add local file-storage service.
- [ ] Add local PDF/document service.
- [ ] Add structured local logging.

## C. Desktop shell

- [ ] Validate Tauri against the existing Next.js application.
- [ ] Add Windows shell without deleting the web application.
- [ ] Establish secure IPC commands.
- [ ] Restrict privileged operations to explicit commands.
- [ ] Add development and production desktop build profiles.

## D. First local module

Migrate institution setup and onboarding first because every later operational record needs an institution and academic context.

- [ ] Local institution.
- [ ] Local settings.
- [ ] Local administrator bootstrap.
- [ ] Academic year.
- [ ] Semesters.
- [ ] Levels.
- [ ] Departments.
- [ ] Programs.
- [ ] Subjects.
- [ ] Classes.

## E. Operational modules

Migrate one module at a time and run offline tests after each module:

1. Students and documents
2. Admissions and enrollment
3. Teachers and assignments
4. Programs/curricula
5. Grades and examinations
6. Timetable and rooms
7. Fees and payments
8. Bulletins/transcripts/certificates
9. Communication/notifications
10. Dashboard/statistics

## F. Reliability gates

A module is not considered migrated until:

- create works offline;
- read/search works offline;
- update works offline;
- delete/archival rules work offline;
- data survives application restart;
- generated files are stored locally;
- authorization is enforced;
- backup includes the module's data;
- restore reproduces the expected data;
- no cloud request is required for normal operation.

## G. Central services

Only after the local operational foundation is stable:

- license activation;
- signed license token;
- offline grace period;
- device activation/deactivation;
- subscription/billing integration;
- update service.

## H. Release

- Windows installer.
- Database migration on upgrade.
- Safe application-data preservation.
- Backup before major upgrade.
- Offline acceptance test.
- LAN acceptance test.
- Security review.
- Performance review.
