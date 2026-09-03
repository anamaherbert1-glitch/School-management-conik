# CONIK Offline Migration Plan

This plan is the implementation checklist for the master architecture. It is intentionally broader than the ARCH-2 foundation: existing MVP functionality remains in scope and is migrated module by module.

## A. Inventory before migration

- [x] Confirm current repository structure.
- [x] Confirm `apps/web` is the existing application entry point.
- [x] Confirm the workspace currently uses Next.js/React and Supabase.
- [x] Inventory the current Supabase-backed modules and access patterns.
- [x] Map the current schema to local SQLite ownership groups.
- [x] Identify pages that already contain reusable business logic.
- [x] Record the ARCH-1 audit in `docs/ARCH1_AUDIT.md`.

## B. Local platform foundation

- [ ] Create a local application service package.
- [x] Define typed repository interfaces.
- [x] Add SQLite driver through the desktop/native layer.
- [x] Add versioned SQLite migrations.
- [x] Add application data-directory resolver for Windows.
- [ ] Add local file-storage service.
- [ ] Add local PDF/document service.
- [ ] Add structured local logging.

## C. Desktop shell

- [x] Validate the desktop boundary against the existing Next.js application structure.
- [x] Add Windows shell without deleting the web application.
- [x] Establish the first secure IPC commands.
- [x] Restrict privileged database operations to explicit commands.
- [x] Add development and production desktop build profiles.

## D. Academic foundation

- [x] Local institution persistence foundation.
- [x] ARCH-2C desktop onboarding persistence.
- [x] ARCH-2D local settings.
- [x] ARCH-2D local administrator bootstrap.
- [x] Academic year.
- [x] Semesters.
- [x] Levels.
- [x] Departments.
- [x] Programs / filières.
- [ ] Subjects.
- [ ] Classes / groups.

## E. MVP operational modules still to build/migrate

These are **not forgotten** and are not considered complete just because the academic foundation is progressing:

1. Students and complete digital dossiers
2. Student document storage
3. Admissions and online/local enrollment
4. Enrollment history and class assignments
5. Teachers and teacher assignments
6. Programs/curricula and program-subject relationships
7. Grades and examinations
8. Timetable and rooms
9. Fees, installments, payments and receipts
10. Bulletins, transcripts and certificates
11. Communication and notifications
12. Dashboard and statistics
13. Users, roles and permissions
14. Audit/activity logs
15. Automatic administrative document generation
16. Local backups and restore
17. LAN operation through a local service
18. Central licensing, activation, subscription and update services

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
