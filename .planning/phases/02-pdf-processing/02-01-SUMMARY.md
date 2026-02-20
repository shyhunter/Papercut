---
phase: 02-pdf-processing
plan: 01
subsystem: pdf
tags: [pdf-lib, tauri, plugin-fs, react-hooks, typescript]

# Dependency graph
requires:
  - phase: 01-app-shell-file-input
    provides: FileEntry type, Tauri app shell, capabilities JSON, Cargo.toml structure
provides:
  - pdf-lib load→resize→save pipeline via processPdf()
  - PdfProcessingOptions and PdfProcessingResult types
  - usePdfProcessor React hook with progress reporting
  - tauri-plugin-fs wired in Rust and JS, with fs:allow-read-file and fs:allow-write-file capabilities
affects:
  - 02-02-PLAN (ConfigureStep.tsx uses PdfProcessingOptions type and usePdfProcessor hook)
  - 02-03-PLAN (save dialog uses fs:allow-write-file and PdfProcessingResult.bytes)

# Tech tracking
tech-stack:
  added:
    - pdf-lib (PDF load, resize, structural save)
    - pdfjs-dist (available for thumbnail generation in 02-02)
    - "@tauri-apps/plugin-fs (readFile for PDF source bytes)"
    - tauri-plugin-fs = "2" (Rust crate)
  patterns:
    - Stateless processor function: processPdf() is a pure async function (no class, no state)
    - Hook-wraps-processor: usePdfProcessor owns all state, caller only calls run()
    - Omit<Options, 'onProgress'> pattern: hook manages progress internally, callers cannot set it
    - useObjectStreams-only save: never useCompression (pdf-lib bug #1445)
    - Scale-to-fit centering: setSize → scaleContent → translateContent order matters

key-files:
  created:
    - src/lib/pdfProcessor.ts
    - src/hooks/usePdfProcessor.ts
  modified:
    - src/types/file.ts
    - src-tauri/Cargo.toml
    - src-tauri/src/lib.rs
    - src-tauri/capabilities/default.json
    - package.json
    - package-lock.json

key-decisions:
  - "useObjectStreams: true is the only structural packing; useCompression is explicitly banned (pdf-lib bug #1445 corrupts output)"
  - "PdfProcessingOptions.selectedPageIndices is required (not optional) — empty array means no resize applied, not all-pages. Callers must populate it."
  - "dialog:allow-save added in 02-01 (not 02-03) so all permissions are co-located in one place"
  - "usePdfProcessor run() accepts Omit<PdfProcessingOptions, 'onProgress'> — hook owns progress callback wiring"

patterns-established:
  - "Scale-to-fit resize: setSize(targetW, targetH) → scaleContent(scale, scale) → translateContent(xOffset, yOffset) — order is invariant"
  - "Typed error handling in hooks: err instanceof Error ? err.message : fallback string — no catch (e: any)"

requirements-completed: [PDF-01, PDF-02]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 2 Plan 01: PDF Engine Setup Summary

**pdf-lib load→resize→save pipeline with plugin-fs wiring, PdfProcessingOptions types, and usePdfProcessor hook providing per-page progress reporting**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T21:25:11Z
- **Completed:** 2026-02-19T21:27:22Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Installed pdf-lib, pdfjs-dist, and @tauri-apps/plugin-fs; wired tauri-plugin-fs in Rust (Cargo.toml + lib.rs) and capabilities JSON
- Implemented stateless pdfProcessor.ts engine: reads file via plugin-fs readFile, loads into pdf-lib, applies per-page scale-to-fit resize (setSize + scaleContent + translateContent), saves with useObjectStreams only
- Implemented usePdfProcessor React hook with isProcessing, progress, result, and error state; run() manages progress callback internally; typed error handling with no `catch (e: any)`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and wire Tauri plugin-fs** - `f0c67f6` (feat)
2. **Task 2: Add PDF processing types to file.ts and implement pdfProcessor.ts** - `fc7a1ed` (feat)
3. **Task 3: Implement usePdfProcessor hook** - `61900a6` (feat)

## Files Created/Modified

- `src/lib/pdfProcessor.ts` - Stateless PDF processing engine (processPdf function)
- `src/hooks/usePdfProcessor.ts` - React hook wrapping processPdf with progress/error state
- `src/types/file.ts` - Added PdfQualityLevel, PdfPagePreset, PdfProcessingOptions, PdfProcessingResult
- `src-tauri/Cargo.toml` - Added tauri-plugin-fs = "2" dependency
- `src-tauri/src/lib.rs` - Registered tauri_plugin_fs::init() before dialog plugin
- `src-tauri/capabilities/default.json` - Added dialog:allow-save, fs:allow-read-file, fs:allow-write-file
- `package.json` - Added pdf-lib, pdfjs-dist, @tauri-apps/plugin-fs
- `package-lock.json` - Updated lockfile

## Decisions Made

- `useCompression: true` is permanently banned — pdf-lib bug #1445 corrupts output. Only `useObjectStreams: true` is used for structural packing.
- `dialog:allow-save` added in this plan (not 02-03) so all capabilities are co-located.
- `selectedPageIndices` is a required array — empty means no resize applied. Callers must build the index array explicitly.
- Hook uses `Omit<PdfProcessingOptions, 'onProgress'>` so callers never wire progress callbacks directly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `processPdf()`, `PdfProcessingOptions`, and `PdfProcessingResult` are fully typed and ready for ConfigureStep.tsx (plan 02-02)
- `usePdfProcessor` hook is ready to integrate into ConfigureStep
- `fs:allow-write-file` and `dialog:allow-save` capabilities are in place for plan 02-03 save dialog
- No blockers or concerns

## Self-Check: PASSED

- FOUND: src/lib/pdfProcessor.ts
- FOUND: src/hooks/usePdfProcessor.ts
- FOUND: src/types/file.ts
- FOUND: 02-01-SUMMARY.md
- FOUND commit: f0c67f6 (Task 1)
- FOUND commit: fc7a1ed (Task 2)
- FOUND commit: 61900a6 (Task 3)

---
*Phase: 02-pdf-processing*
*Completed: 2026-02-19*
