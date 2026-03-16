---
phase: 16-pdf-editor-gs-bundling
plan: 01
subsystem: backend
tags: [ghostscript, sidecar, tauri, bundling]
---

## Summary

Reverted from system PATH Ghostscript lookup to bundled sidecar binary. Added `spawn_gs()` helper that resolves the Tauri sidecar first, falling back to system PATH. Updated all 5 GS-dependent callers (compress, protect, unlock, PDF/A, repair) to use the new helper. Added `is_ghostscript_available()` for runtime availability checks.

## Self-Check: PASSED

- [x] tauri.conf.json declares externalBin for GS sidecar
- [x] spawn_gs() resolves bundled binary first, falls back to PATH
- [x] All 5 GS callers updated to use spawn_gs()
- [x] cargo check passes

## Commits

- `83bdfc7` chore(16-01): configure GS sidecar bundling in Tauri
- `15f6d57` feat(16-01): update find_ghostscript to prefer bundled sidecar binary

## Key Files

### Created
- `src-tauri/binaries/README.md` — instructions for placing GS binary

### Modified
- `src-tauri/tauri.conf.json` — externalBin declaration
- `src-tauri/src/lib.rs` — spawn_gs() helper, updated callers
- `src-tauri/binaries/.gitignore` — ignore binaries except README

## Decisions

- spawn_gs() pattern: single helper replaces all direct Command::new("gs") calls
- Sidecar-first resolution: bundled binary takes priority over system PATH for zero-install experience
