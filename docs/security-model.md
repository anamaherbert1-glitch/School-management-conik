# Security model

## Authentication

Supabase Auth is the identity provider. Protected application routes must resolve the authenticated user server-side before returning private data.

## Authorization

Authorization is based on organization membership, role and permission. UI visibility is only a convenience; server/database policies remain authoritative.

## Tenant isolation

Every organization-owned business record must carry `organization_id`. Database access must be protected with Row Level Security so a user from one establishment cannot read or mutate another establishment's data.

## Auditability

Administrative actions should be recorded in an audit log with actor, organization, action, entity and timestamp.

## Secrets

Only public Supabase URL and publishable/anonymous client key may be exposed to browser code. Service-role credentials must remain server-side and must never use a `NEXT_PUBLIC_` variable.
