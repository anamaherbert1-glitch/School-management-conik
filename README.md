# School management conik

SaaS de gestion scolaire et universitaire conçu pour centraliser les admissions, étudiants, programmes académiques, paiements, notes, examens, emplois du temps, documents, communication et administration.

## Architecture

- Frontend : Next.js / React / TypeScript
- Backend : API TypeScript
- Base de données : PostgreSQL via Supabase
- Authentification : Supabase Auth
- Architecture : SaaS multi-tenant
- Versionnement : GitHub

## État du projet

Phase 1 — fondation du projet et architecture.

## Principes

1. Isolation stricte des données entre établissements.
2. Authentification et autorisation par rôles et permissions.
3. Les modules métier doivent être reliés à la base de données réelle.
4. Toute fonctionnalité importante doit être testable et traçable.
