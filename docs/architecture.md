# Architecture — School management conik

## Core layers

- Web application: Next.js, React, TypeScript
- Authentication: Supabase Auth
- Data: PostgreSQL via Supabase
- Authorization: roles, permissions and tenant membership
- Storage: Supabase Storage for controlled document uploads

## Tenant model

An `organization` represents one school/university. Business records that belong to an establishment must reference its organization and be protected by Row Level Security.

## Initial identity flow

1. User authenticates with Supabase Auth.
2. Application resolves the user's profile.
3. Application resolves organization membership.
4. Role and permissions determine accessible modules and actions.
5. Protected pages and server operations enforce authorization.

## Development rule

Do not ship UI-only features as complete functionality. A business action is complete only when its validation, authorization, persistence, error handling and auditability are implemented.
