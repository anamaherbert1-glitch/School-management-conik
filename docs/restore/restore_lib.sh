#!/bin/bash
# Reconstruct lib.rs from base64 parts
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
cat docs/restore/lib_part_*.b64 | tr -d '\n' | base64 -d > apps/desktop/src-tauri/src/lib.rs
echo "Restored apps/desktop/src-tauri/src/lib.rs ($(wc -c < apps/desktop/src-tauri/src/lib.rs) bytes)"
grep -c create_student apps/desktop/src-tauri/src/lib.rs && echo "OK: create_student present"
