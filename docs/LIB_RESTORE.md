# Restauration lib.rs (URGENT — ARCH-2I)

Le fichier `apps/desktop/src-tauri/src/lib.rs` a été tronqué.

## État sur main (vérifié)

| Élément | Statut |
|---------|--------|
| Migration `008_student_documents.sql` | OK |
| `docs/ARCH-2I.md` | OK |
| Bridge TS `localStudents.saveDocument / listDocuments / deleteDocument / openDocument` | OK |
| UI dossier (`local-student-dossier.tsx`) onglet Documents | OK |
| Plan offline (checkbox documents) | OK |
| **`lib.rs` natif** | **À RESTAURER** |

## Restauration recommandée

1. Récupère le fichier complet `lib_rs_ARCH2I_full.rs` fourni dans la session Grok (artifacts) — il contient :
   - Migrations 001 → 008
   - Toutes les commandes métier jusqu'aux étudiants + inscriptions
   - Les 4 commandes documents ARCH-2I

2. Sur ta machine :

```bash
cd School-management-conik
# Copie le contenu de lib_rs_ARCH2I_full.rs dans :
# apps/desktop/src-tauri/src/lib.rs

git add apps/desktop/src-tauri/src/lib.rs
git commit -m "fix(desktop): restore full Tauri SQLite runtime + ARCH-2I student documents"
git push
```

## Alternative (depuis un commit sain antérieur)

```bash
git show fd95e38:apps/desktop/src-tauri/src/lib.rs > apps/desktop/src-tauri/src/lib.rs
# Puis ajouter manuellement MIGRATION_008 + les 4 commandes documents (voir ARCH-2I.md)
```

## Vérification après restore

```bash
cd apps/desktop
pnpm tauri dev
# Ouvrir un élève → onglet Documents → uploader un PDF/image
# Redémarrer l'app → le document doit toujours être là
```

Fichiers stockés sous `C:\CONIK\documents\students\{student_id}\`.
