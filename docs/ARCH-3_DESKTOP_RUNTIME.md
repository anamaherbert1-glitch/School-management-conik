# ARCH-3 — Desktop runtime decision

## Decision: static export (Next.js `output: 'export'`) loaded by Tauri

Rejected alternative: embedding a local Node/Next server in the Windows app.

| Criterion | Static export | Embedded local server |
|---|---|---|
| Installer size | small (HTML/JS only) | +60-90 MB (Node runtime) |
| Moving parts on the school PC | none | a background process + a local port |
| Security | no open port; data only via Tauri IPC commands | local HTTP port reachable by other processes |
| Already configured | yes (`frontendDist: ../web/out`) | no |
| Cost | server pages must become client pages | none at first |

## Consequences / rules
1. `pnpm build:desktop` sets `CONIK_TARGET=desktop` -> static export.
2. Screens used offline are client components and read/write through `lib/local/tauri.ts`; never Supabase.
3. Dynamic routes (`/students/[id]`) become query-string pages (`/students/view?id=`) or provide `generateStaticParams`.
4. `app/api/bulletins/render` moves to a native Tauri command (PDF) during the bulletins step.
5. Supabase stays only for central services: licensing, activation, updates.

## Migration order
1. Students  2. Enrollments  3. Grades  4. Bulletins
