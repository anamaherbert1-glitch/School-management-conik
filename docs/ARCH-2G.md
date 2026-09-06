# ARCH-2G — Matières et classes/groupes locaux

## Objectif

Compléter la structure académique offline de CONIK avec les **matières** et les **classes/groupes**, en conservant la frontière React → IPC Tauri → SQLite et sans casser le chemin web/Supabase.

## Livré

- Migration SQLite `006_subjects_classes.sql`.
- Table `subjects_local` : établissement, département/programme optionnels, code, coefficient, statut.
- Table `class_groups_local` : établissement, programme, niveau, année académique, capacité, salle, statut.
- Unicité des codes/noms par établissement (et par année pour les classes).
- Commandes Tauri : création et listage des matières et des classes.
- Bridge TypeScript `localCatalog` étendu.
- Migration automatique du runtime local jusqu'à la version 6.

## Garanties

- Données locales dans `C:\\CONIK\\data\\conik.db`.
- Aucune dépendance réseau pour create/list en Desktop.
- L'établissement parent doit exister.
- Les références programme / niveau / année / département sont validées côté native.
- Le web/Supabase existant reste intact.

## Suite immédiate (ordre recommandé)

1. **ARCH-2H** — Étudiants + inscriptions + affectation aux classes (cœur métier).
2. Enseignants + affectations matières/classes.
3. Notes / évaluations / bulletins (réutiliser la logique métier déjà présente côté web).
4. Finance (frais, échéances, paiements, reçus).
5. Documents locaux + backup/restore.
6. Auth locale complète (login session) + audit.
7. LAN service + licence centrale.

## Règle de migration

Un module n'est considéré migré que s'il fonctionne offline de bout en bout (create/read/update, survie au redémarrage, autorisation, pas d'appel cloud obligatoire).
