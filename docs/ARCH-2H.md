# ARCH-2H — Étudiants et inscriptions locaux

## Objectif

Migrer le cœur métier **étudiants + inscriptions + affectation aux classes** vers SQLite local, sans supprimer le chemin web/Supabase existant.

## Livré

- Migration `007_students_enrollments.sql`
- Table `students_local` (dossier élève, tuteur, statut)
- Table `enrollments_local` (inscription année / programme / niveau / classe)
- Unicité du numéro d'élève par établissement
- Unicité d'inscription par élève et année académique
- Commandes natives prévues : create/list/get/update student, create/list enrollment, assign to class
- Bridge TypeScript `localStudents`

## Garanties

- Données dans `C:\\CONIK\\data\\conik.db`
- Validation institution / année / classe côté native
- Web/Supabase conservé en parallèle

## Critères de validation offline

- Créer un élève sans réseau
- Lire / rechercher après redémarrage
- Inscrire pour une année académique
- Affecter à une classe
- Mettre à jour le dossier

## Suite

- ARCH-2I Enseignants
- ARCH-2J Notes / bulletins
- ARCH-2K Finance
- Documents élèves + backup
