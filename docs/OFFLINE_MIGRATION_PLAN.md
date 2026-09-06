# CONIK Offline Migration Plan

This plan is the implementation checklist for the master architecture.

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
- [x] Add versioned SQLite migrations (001-007).
- [x] Add application data-directory resolver for Windows.
- [ ] Add local file-storage service.
- [ ] Add local PDF/document service.
- [ ] Add structured local logging.

## C. Desktop shell

- [x] Validate the desktop boundary against the existing Next.js application structure.
- [x] Add Windows shell without deleting the web application.
- [x] Establish the first secure IPC commands.
- [ ] **Restore full command set in lib.rs after truncated push (see docs/LIB_RESTORE.md)**.
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
- [x] Subjects (migration 006 + TS bridge).
- [x] Classes / groups (migration 006 + TS bridge).

## E. MVP operational modules

1. [x] Students schema + TS bridge (migration 007) — **native commands pending lib.rs restore**
2. [ ] Student document storage
3. [ ] Admissions and online/local enrollment
4. [x] Enrollment schema + assign-to-class API surface
5. [ ] Teachers and teacher assignments
6. [ ] Grades and examinations
7. [ ] Timetable and rooms
8. [ ] Fees, installments, payments and receipts
9. [ ] Bulletins, transcripts and certificates
10. [ ] Communication and notifications
11. [ ] Dashboard and statistics
12. [ ] Users, roles and permissions (local auth session)
13. [ ] Audit/activity logs
14. [ ] Local backups and restore
15. [ ] LAN operation through a local service
16. [ ] Central licensing, activation, subscription and update services

## F. Reliability gates

A module is not considered migrated until create/read/update work offline, data survives restart, authorization is enforced, and no cloud request is required for normal operation.

## G. Central services

Only after the local operational foundation is stable: license activation, offline token, device management, subscriptions, updates.

## H. Release

Windows installer, migration on upgrade, offline acceptance test, security and performance review.
