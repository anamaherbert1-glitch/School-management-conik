# Restore lib.rs

```bash
cd School-management-conik
bash docs/restore/restore_lib.sh
git add apps/desktop/src-tauri/src/lib.rs
git commit -m "fix(desktop): restore full lib.rs from base64 pack (ARCH-2I documents)"
git push
```

Contains migrations 001-008 + all commands including student documents.
