# ARCH-2I — Documents élèves locaux

## Objectif

Persister les **documents élèves** hors-ligne : métadonnées en SQLite + fichiers sous `C:\CONIK\documents\students\{student_id}\`.

## Livré

- Migration `008_student_documents.sql`
- Table `student_documents_local`
- Types : identity, birth_certificate, photo, transcript, medical, report, other
- Commandes natives : `save_student_document`, `list_student_documents`, `delete_student_document`, `open_student_document`
- Bridge TypeScript `localStudents.saveDocument / listDocuments / deleteDocument / openDocument`
- Onglet Documents sur le dossier élève desktop

## Garanties

- Fichiers dans `C:\CONIK\documents\students\...`
- Limite 15 Mo par fichier
- Nom de fichier sanitizé côté native
- Suppression = ligne DB + fichier disque
- Web/Supabase conservé en parallèle

## Critères offline

- Uploader un document sans réseau
- Le relire après redémarrage
- L’ouvrir avec l’application système
- Le supprimer (DB + disque)

## Suite

- ARCH-2J Enseignants
- Notes / bulletins
- Backup (inclure le dossier documents)
