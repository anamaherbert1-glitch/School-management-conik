# Restauration lib.rs (URGENT)

Le fichier `apps/desktop/src-tauri/src/lib.rs` a été tronqué par erreur lors d'un push automatisé.

## État actuel sur main

- Migrations SQL **006** (matières/classes) et **007** (étudiants/inscriptions) : OK
- Bridge TypeScript `tauri.ts` avec `localCatalog` + `localStudents` : OK  
- Docs ARCH-2G et ARCH-2H : OK
- `lib.rs` natif : **incomplet** (init runtime + migrations seulement)

## Restauration rapide

```bash
git clone https://github.com/anamaherbert1-glitch/School-management-conik.git
cd School-management-conik

# Version complète des commandes métier (avant troncature)
git show 88842589cacdda376b9185b8c0632f4f7fcca441:apps/desktop/src-tauri/src/lib.rs > apps/desktop/src-tauri/src/lib.rs
```

Ensuite ajouter les constantes MIGRATION_006 / MIGRATION_007 et le chaînage `if v<6` / `if v<7` dans `open_database()`, puis les commandes subjects / class_groups / students / enrollments (voir `docs/ARCH-2G.md` et `docs/ARCH-2H.md`).

## Fichier complet prêt

Le workspace de session contient `lib_full.rs` (41 Ko) avec tout le runtime natif jusqu'aux étudiants. Le coller dans `apps/desktop/src-tauri/src/lib.rs` puis commit/push depuis ta machine.

```bash
git add apps/desktop/src-tauri/src/lib.rs
git commit -m "fix(desktop): restore full Tauri SQLite commands including students"
git push
```
