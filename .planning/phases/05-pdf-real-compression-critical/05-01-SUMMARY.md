---
phase: 05-pdf-real-compression-critical
plan: 01
subsystem: pdf
tags: [tauri, ghostscript, sidecar, rust, pdf-compression, tauri-plugin-shell]

# Dependency graph
requires:
  - phase: 02-pdf-processing
    provides: pdf-lib PDF pipeline that this phase replaces with real GS compression

provides:
  - "compress_pdf Tauri command in lib.rs: validates preset, invokes GS sidecar, returns compressed bytes"
  - "Ghostscript sidecar binary at src-tauri/binaries/gs-aarch64-apple-darwin"
  - "bundle.externalBin declaration in tauri.conf.json for GS bundling"
  - "test-fixtures/photo_heavy.pdf: real 3-page image-heavy PDF (2.3 MB) for compression tests"
  - "scripts/generate_photo_heavy_pdf.mjs: reproducible fixture generator"

affects:
  - "05-02: TypeScript pdfProcessor that will invoke the compress_pdf command"
  - "05-03: UI updates that display compression results"

# Tech tracking
tech-stack:
  added:
    - "tauri-plugin-shell = 2 (Rust crate)"
    - "@tauri-apps/plugin-shell (npm package)"
    - "Ghostscript 10.06.0 (system binary, sidecar-copied)"
  patterns:
    - "Tauri sidecar pattern: binary named {name}-{target-triple} in src-tauri/binaries/"
    - "GS subprocess: -sDEVICE=pdfwrite -dNOPAUSE -dBATCH -dQUIET -dPDFSETTINGS=/{preset} -sOutputFile={tmp} {src}"
    - "compress_pdf validates preset allow-list (screen/ebook/printer/prepress) before invoking GS"
    - "Temp file pattern: write to OS temp dir, read bytes back, delete — no streaming"

key-files:
  created:
    - "src-tauri/binaries/gs-aarch64-apple-darwin — Ghostscript sidecar binary (15 MB)"
    - "scripts/generate_photo_heavy_pdf.mjs — Node.js fixture generator using pdf-lib"
    - "test-fixtures/photo_heavy.pdf — 3-page JPEG-embedded PDF, 2.3 MB"
  modified:
    - "src-tauri/Cargo.toml — added tauri-plugin-shell = 2"
    - "src-tauri/src/lib.rs — added compress_pdf_with_gs(), compress_pdf command, PC-GS-01 test"
    - "src-tauri/tauri.conf.json — added bundle.externalBin: [binaries/gs]"
    - "src-tauri/capabilities/default.json — added shell:allow-execute (gs sidecar), fs permissions for $TEMP"
    - "src-tauri/src/bin/generate_fixtures.rs — documentation comment for photo_heavy.pdf"
    - "package.json / package-lock.json — @tauri-apps/plugin-shell added"

key-decisions:
  - "Ghostscript installed via Homebrew (brew install ghostscript) and binary copied to src-tauri/binaries/gs-aarch64-apple-darwin for Tauri sidecar bundling"
  - "Temp file lifecycle managed in Rust stdlib (std::env::temp_dir, std::fs::read/remove_file) — not via Tauri FS plugin — so no JS-side TEMP permissions needed for the Rust command"
  - "fs:allow-write-file and fs:allow-remove scoped to $TEMP/** added for Plan 02 which writes temp PDFs from the JS side before passing to GS"
  - "photo_heavy.pdf generated via Node.js pdf-lib script (not Rust/lopdf) — simpler, uses existing pdf-lib dep"
  - "Preset allow-list in compress_pdf: screen, ebook, printer, prepress — matches GS native -dPDFSETTINGS values"

patterns-established:
  - "Tauri sidecar binary naming: {name}-{rustc-target-triple} (e.g., gs-aarch64-apple-darwin)"
  - "shell:allow-execute capability with sidecar scope: { name: gs, sidecar: true }"
  - "Preset injection guard: validate against const allow-list before invoking subprocess"

requirements-completed: [PDF-01, PDF-04]

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 5 Plan 01: GS Sidecar and compress_pdf Command Summary

**Ghostscript bundled as Tauri sidecar (aarch64-apple-darwin), compress_pdf Rust command with preset validation, and 2.3 MB photo-heavy PDF fixture committed for compression difference tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T16:09:15Z
- **Completed:** 2026-02-23T16:15:11Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Ghostscript 10.06.0 installed and copied to `src-tauri/binaries/gs-aarch64-apple-darwin` as Tauri sidecar
- `compress_pdf` Tauri command implemented: validates preset allow-list, invokes GS subprocess, returns compressed bytes via `tauri::ipc::Response`
- `test-fixtures/photo_heavy.pdf` generated (2.3 MB, 3-page JPEG-embedded PDF) for compression difference assertions
- `scripts/generate_photo_heavy_pdf.mjs` committed for reproducible fixture regeneration
- All 17 Rust tests pass; all 191 npm tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tauri-plugin-shell and Ghostscript sidecar configuration** - `cbaa028` (chore)
2. **Task 2: Implement compress_pdf Rust command** - `880ceb4` (feat)
3. **Task 3: Generate photo-heavy PDF fixture and add compression tests** - `a0995ba` (feat)

## Files Created/Modified

- `src-tauri/binaries/gs-aarch64-apple-darwin` — Ghostscript 10.06.0 binary, Tauri sidecar (15 MB)
- `src-tauri/src/lib.rs` — Added `compress_pdf_with_gs()`, `compress_pdf` command, `compress_pdf_invalid_preset_is_rejected` test
- `src-tauri/Cargo.toml` — Added `tauri-plugin-shell = "2"`
- `src-tauri/tauri.conf.json` — Added `bundle.externalBin: ["binaries/gs"]`
- `src-tauri/capabilities/default.json` — Added `shell:allow-execute` (gs sidecar scope), `fs:allow-write-file` + `fs:allow-remove` ($TEMP/**)
- `src-tauri/src/bin/generate_fixtures.rs` — Added documentation comment for photo_heavy.pdf
- `scripts/generate_photo_heavy_pdf.mjs` — Node.js fixture generator (pdf-lib embeds pexels JPEG into 3-page PDF)
- `test-fixtures/photo_heavy.pdf` — 2.3 MB, PDF 1.7, 3 pages with embedded JPEG images
- `package.json` / `package-lock.json` — `@tauri-apps/plugin-shell` npm package

## Decisions Made

- **Ghostscript source:** brew install ghostscript + binary copy to binaries/ dir (Tauri sidecar mechanism)
- **Temp file management in Rust:** Used `std::fs` directly in the Rust command (stdlib, not Tauri FS plugin) so no TEMP JS-side permissions are needed for the compress_pdf command itself; `$TEMP/**` FS permissions added for Plan 02's JS-side temp file operations
- **Fixture generation approach:** Node.js script using pdf-lib (already a project dependency) rather than Rust/lopdf; simpler, no new Rust dep required
- **Preset allow-list:** Validates `["screen", "ebook", "printer", "prepress"]` — exact GS `-dPDFSETTINGS` preset strings; rejects old UI-layer names (low/high/medium/best)

## Deviations from Plan

None - plan executed exactly as written. Ghostscript was not pre-installed but the plan included the `brew install ghostscript` step which resolved it without any architectural change.

## Issues Encountered

None — all tasks completed on first attempt.

## User Setup Required

None - no external service configuration required. Ghostscript is bundled as a sidecar binary inside the Tauri app.

## Next Phase Readiness

- `compress_pdf` command is registered and callable from TypeScript via `invoke('compress_pdf', { sourcePath, preset })`
- The command returns binary PDF bytes as `ArrayBuffer` via `tauri::ipc::Response`
- Plan 02 can immediately wire the TypeScript `pdfProcessor.ts` to call this command
- `photo_heavy.pdf` fixture is committed and ready for compression ratio assertions in Plan 02 tests
- Ghostscript sidecar is declared in `tauri.conf.json` — will be bundled automatically on `tauri build`

---
*Phase: 05-pdf-real-compression-critical*
*Completed: 2026-02-23*
