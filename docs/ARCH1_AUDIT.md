# CONIK School Management — ARCH-1 Audit

Date: 2026-09-02
Status: COMPLETE — audit baseline established; implementation migration has not yet started.

## 1. Current runtime baseline

The existing product is a Next.js + React + TypeScript application under `apps/web`. Its package manifest currently depends on Next.js, React, `@supabase/ssr`, and `@supabase/supabase-js`. The current application is therefore cloud-connected by design and is not yet an offline desktop runtime.

The current TypeScript configuration uses the `@/*` alias and browser/server code is compiled as part of the Next.js application.

## 2. Current data access architecture

### Browser/client layer

Several client components instantiate the Supabase browser client directly. Examples audited:

- `apps/web/app/admin/academic/page.tsx`
- `apps/web/app/students/student-manager.tsx`
- `apps/web/app/classes/class-manager.tsx`
- `apps/web/app/bulletins/page.tsx`
- `apps/web/app/admission/page.tsx`

These components perform reads, inserts, updates and RPC calls directly against Supabase. This is the principal migration boundary: UI components must progressively call a local repository/service API instead of knowing the operational database implementation.

### Server layer

`apps/web/lib/supabase/server.ts` and `apps/web/proxy.ts` depend on Supabase SSR/Auth. The current route protection is therefore cloud-session based and must eventually be replaced or complemented by local session management for desktop/offline operation.

### API layer

The existing Next.js API route for bulletin rendering is a useful business/document-rendering asset, but it currently lives inside the web runtime. The final desktop architecture should move this responsibility behind the local document/PDF service while preserving the renderer's business rules.

## 3. Current feature inventory observed

| Area | Existing implementation | Target ownership | Migration priority |
|---|---|---|---|
| Authentication/session | Supabase Auth + SSR cookies | Local desktop auth/session | P0 |
| Institution/onboarding | Supabase RPC `create_school_for_current_user` | Local SQLite + local auth bootstrap | P0 |
| Dashboard | Real Supabase counts | Local repositories/services | P1 |
| Students | CRUD + RPCs | Local SQLite service | P1 |
| Student documents | Supabase-backed document records/storage | Local filesystem + SQLite metadata | P1 |
| Admissions | Public online flow + uploads + RPCs | Local admissions + optional online gateway | P2 |
| Academic structure | Programs, levels, subjects, classes | Local SQLite | P1 |
| Teachers | Teacher management/assignments | Local SQLite | P2 |
| Grades/exams | Assessments + grades + deterministic UI calculations | Local SQLite + domain calculation service | P2 |
| Bulletins | Templates, generation history, local browser print path | Local document/PDF service + SQLite history | P2 |
| Finance | Fee types, installments, payments, receipts, balances | Local SQLite + local receipt generation | P2 |
| Communication | Existing navigation/roadmap area | Local queue first; Internet optional | P3 |
| Licensing/subscriptions | Subscription tables already exist centrally | Central CONIK service | P3 |
| Backup/restore | Not yet a local operational service | Windows filesystem + SQLite backup service | P0 |
| LAN | Not implemented | Local CONIK server + LAN clients | P3 |

## 4. Current database inventory

The connected Supabase project currently exposes 38 operational/commercial tables plus the `student_fee_balances` view. The principal operational tables are:

`organizations`, `profiles`, `organization_members`, `roles`, `permissions`, `role_permissions`, `academic_years`, `academic_semesters`, `academic_periods`, `departments`, `programs`, `levels`, `subjects`, `program_subjects`, `class_groups`, `rooms`, `teachers`, `teacher_subject_assignments`, `students`, `student_enrollments`, `student_class_assignments`, `student_documents`, `admission_applications`, `admission_document_requirements`, `admission_application_documents`, `admission_settings`, `assessments`, `grades`, `bulletin_templates`, `generated_bulletins`, `bulletin_generation_history`, `fee_types`, `fee_installments`, `payments`, `payment_receipts`, `activity_logs`, `subscription_plans`, `subscriptions`.

The schema already contains most of the business concepts required by the target local model. This is favorable for migration: the project should transform and normalize existing concepts rather than redesign the product from zero.

## 5. Local SQLite mapping baseline

The existing schema provides a strong starting point for a local relational schema. The following groups should become versioned local SQLite migrations:

### Identity and institution

- organizations → institution
- profiles → local users/person profiles
- organization_members → local organization memberships
- roles / permissions / role_permissions → local RBAC
- activity_logs → audit log

### Academic structure

- academic_years
- academic_semesters
- academic_periods
- departments
- programs
- levels
- subjects
- program_subjects
- class_groups
- rooms

### People and enrollment

- students
- student_enrollments
- student_class_assignments
- teachers
- teacher_subject_assignments

### Admissions and documents

- admission_applications
- admission_document_requirements
- admission_application_documents
- student_documents

### Assessment and academic results

- assessments
- grades
- bulletin_templates
- generated_bulletins
- bulletin_generation_history

### Finance

- fee_types
- fee_installments
- payments
- payment_receipts
- student_fee_balances → local query/view/service projection

### Central-only commercial data

- subscription_plans
- subscriptions

These must remain central to CONIK licensing/commercial services and must not become a requirement for ordinary offline school operations.

## 6. Important migration findings

### Finding A — UI/database coupling is high

Business pages frequently know the Supabase table names, RPC names, and organization-scoping rules. This is functional today but unsuitable as the final desktop architecture. A repository/service abstraction must be introduced before large-scale migration.

### Finding B — Authentication is cloud-dependent

The current protected application relies on Supabase Auth and cookies. Desktop mode needs a local identity/session layer with password hashing, role resolution, inactivity timeout and audit logging.

### Finding C — Online admissions is a special case

The existing `/admission` flow is explicitly online: it loads public admission configuration from Supabase and uploads files to a Supabase Edge Function. This should be preserved as an optional online admissions gateway, while the school desktop application gets its own local admissions workflow.

### Finding D — Bulletin generation contains reusable domain logic

The existing bulletin flow already loads assessments/grades, calculates averages/ranks, persists generation history, and renders A4 output. These rules should be extracted into a local domain/document service rather than discarded.

### Finding E — Finance already has a relational foundation

The existing fee/payment/receipt schema is suitable as a starting point for local finance. The paused finance work must continue only after the local repository and database foundation exists.

### Finding F — Desktop filesystem services do not exist yet

There is no local `C:\CONIK\` storage service in the current web application. This is a new platform capability and must be introduced through the desktop/native layer, not simulated with browser storage.

### Finding G — LAN service does not exist yet

The current application has no local LAN server boundary. SQLite must never be exposed as a shared file to client PCs; a local service must mediate database access.

## 7. Target dependency direction

The migration must converge toward:

```text
React UI
   ↓
Application services / use-cases
   ↓
Typed repositories
   ↓
SQLite adapter
   ↓
C:\CONIK\data\conik.db
```

and for files:

```text
React UI
   ↓
Document/File service
   ↓
Validated local filesystem operations
   ↓
C:\CONIK\documents\...
C:\CONIK\generated\...
```

The UI must not receive SQLite credentials, privileged filesystem access, central payment secrets, license-signing secrets, or Supabase service-role credentials.

## 8. Architecture decision after audit

The existing Next.js/React application is **not discarded**. It becomes the reusable presentation/business-logic starting point while operational persistence is moved behind local services.

The first implementation target is therefore **not** a complete desktop rewrite. It is the smallest safe platform foundation that lets the existing onboarding/institution workflow persist locally and lets the UI consume it through a stable service boundary.

## 9. ARCH-1 completion checklist

- [x] Existing repository/application entry point identified.
- [x] Existing frontend/runtime dependencies identified.
- [x] Existing Supabase client/server coupling identified.
- [x] Major operational modules mapped.
- [x] Current database schema inventoried.
- [x] Local vs central ownership classified.
- [x] Primary migration boundary identified.
- [x] First local migration target identified: institution/onboarding.
- [ ] Local desktop shell implemented — next phase.
- [ ] SQLite adapter implemented — next phase.
- [ ] Local institution persistence implemented — next phase.

## 10. Next authorized implementation step

**ARCH-2 — Local platform foundation:** create the local application-service boundary, define the typed repository contracts, add the desktop/native project structure, and prepare versioned SQLite migrations without removing the existing web application.
