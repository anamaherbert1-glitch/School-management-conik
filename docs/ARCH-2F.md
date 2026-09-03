# ARCH-2F — Niveaux et départements locaux

## Objectif

Poursuivre la migration hors ligne de CONIK en rendant les référentiels **Niveaux** et **Départements** disponibles dans SQLite local, sans supprimer le fonctionnement web/Supabase existant.

## Livré

- Migration SQLite `004_levels_departments`.
- Table `levels_local`, liée à l'établissement.
- Table `departments_local`, liée à l'établissement.
- Unicité du code et du nom par établissement.
- Statut actif/inactif pour les deux référentiels.
- Ordre (`sequence`) pour les niveaux.
- Commandes Tauri : création et lecture des niveaux et départements.
- Bridge TypeScript local dédié dans `apps/web/lib/local/catalog.ts`.
- Migration automatique du runtime local jusqu'à la version 4.

## Garanties

- Les données restent locales dans `C:\CONIK\data\conik.db`.
- Aucune dépendance réseau n'est introduite pour ces opérations.
- L'établissement parent doit exister avant création.
- Les doublons sont refusés par les contraintes SQLite.
- Les anciennes fonctionnalités ne sont pas supprimées.

## Suite

ARCH-2G pourra construire les **filières/programmes** au-dessus des départements et niveaux, puis ARCH-2H les matières et enfin les classes/groupes, en conservant la même frontière React → IPC → SQLite.
