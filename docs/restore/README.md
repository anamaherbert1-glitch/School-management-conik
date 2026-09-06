# Restore full lib.rs

From the repository root:

```bash
bash docs/restore/restore_lib.sh
git add apps/desktop/src-tauri/src/lib.rs
git commit -m "fix(desktop): restore full Tauri SQLite command set"
git push
```

This reconstructs the complete native runtime including subjects, class groups, students and enrollments.
