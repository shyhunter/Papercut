---
phase: 05-pdf-real-compression-critical
plan: 02
subsystem: pdf
tags: [tauri, ghostscript, pdf-compression, pdf-lib, typescript, vitest, invoke]

# Dependency graph
requires:
  - phase: 05-pdf-real-compression-critical
    provides: "compress_pdf Tauri command (Plan 01) — GS sidecar callable via invoke('compress_pdf', { sourcePath, preset })"
  - phase: 02-pdf-processing
    provides: "pdfProcessor.ts pipeline and PdfProcessingOptions/PdfProcessingResult types"

provides:
  - "Updated PdfQualityLevel: 'web' | 'screen' | 'print' | 'archive' (replaces 'low'|'medium'|'high'|'maximum')"
  - "PdfProcessingResult extended with imageCount and compressibilityScore pre-scan fields"
  - "processPdf now invokes GS sidecar via invoke('compress_pdf') when compressionEnabled=true"
  - "QUALITY_TO_GS_PRESET mapping: web→screen, screen→ebook, print→printer, archive→prepress"
  - "scanPdfImages() — type-safe pdf-lib image XObject counter using Resources() + lookupMaybe()"
  - "recommendQualityForTarget() — exported quality hint function based on target/input size ratio"
  - "getPdfImageCount() — standalone pre-scan export"
  - "pdfProcessor.test.ts: [PC-02/PC-03] ratio assertion, [PC-REGRESSION-01], [PC-RESIZE-COMPRESS-01]"
  - "setup.ts: @tauri-apps/api/path and remove function mocks for GS temp file operations"

affects:
  - "05-03: UI ConfigureStep must update quality level strings from old to new labels"
  - "05-03: CompareStep.test.tsx mock fixture must add imageCount and compressibilityScore fields"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GS invocation pattern: invoke('compress_pdf', { sourcePath, preset }) returns ArrayBuffer of compressed bytes"
    - "Temp file pattern (JS side): join() from @tauri-apps/api/path for cross-platform paths; writeFile temp → invoke GS → remove temp"
    - "pdf-lib image scan: page.node.Resources() → lookupMaybe(XObject, PDFDict) → lookupMaybe(key, PDFStream) → stream.dict.lookupMaybe(Subtype, PDFName)"
    - "Dimension tests use compressionEnabled=false so result.bytes is parseable pdf-lib output (GS mock output is not a valid parsed PDF)"
    - "Resize + compression ordering: pdfDoc.save({ useObjectStreams: false }) first when resizeEnabled, then GS receives post-resize bytes"

key-files:
  created: []
  modified:
    - "src/types/file.ts — PdfQualityLevel renamed to intent labels; PdfProcessingResult + imageCount + compressibilityScore"
    - "src/lib/pdfProcessor.ts — GS invocation, pre-scan, QUALITY_TO_GS_PRESET, recommendQualityForTarget export"
    - "src/lib/__tests__/pdfProcessor.test.ts — GS mocks, new tests, quality label updates, compressionEnabled=false for dimension tests"
    - "src/test/setup.ts — @tauri-apps/api/path mock (tempDir, join) and remove mock for plugin-fs"

key-decisions:
  - "Type-safe pdf-lib scan: use Resources() + lookupMaybe(PDFDict) instead of .get()?.resolve() chain — PDFObject has no resolve() method; lookupMaybe handles ref resolution automatically"
  - "Dimension tests set compressionEnabled=false: result.bytes is GS mock output (not parseable) when compressionEnabled=true; resize geometry tests only need pdf-lib structural output"
  - "Post-resize bytes to GS: pdfDoc.save({ useObjectStreams: false }) when resizeEnabled=true, not sourceBytes — prevents silent resize discard in combined resize+compression path"

patterns-established:
  - "GS mock pattern: vi.mocked(invoke).mockResolvedValue(outputBytes.buffer) — ArrayBuffer return matches real Tauri IPC"
  - "Quality mapping record: Record<PdfQualityLevel, string> keyed by intent labels with GS preset values"

requirements-completed: [PDF-01, PDF-04]

# Metrics
duration: 8min
completed: 2026-02-23
---

# Phase 5 Plan 02: TypeScript GS Pipeline Wire-up Summary

**GS compression wired into processPdf via invoke('compress_pdf'), with intent-based quality labels (web/screen/print/archive), PDF pre-scan for image count, and full test coverage including [PC-RESIZE-COMPRESS-01] regression**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23T16:18:45Z
- **Completed:** 2026-02-23T16:26:53Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `PdfQualityLevel` updated from `'low'|'medium'|'high'|'maximum'` to `'web'|'screen'|'print'|'archive'` — intent-based labels mapping directly to GS presets
- `processPdf` now invokes `compress_pdf` Tauri command when `compressionEnabled=true`; post-resize bytes are always passed to GS (not sourceBytes), preventing silent resize discard
- `scanPdfImages()` implemented using type-safe pdf-lib API (`Resources()`, `lookupMaybe()`) to count image XObjects and compute `compressibilityScore`
- `recommendQualityForTarget()` exported as quality hint for target-size-based auto-selection
- All 194 tests pass; [PC-02/PC-03] now asserts real size difference; [PC-RESIZE-COMPRESS-01] guards the resize+compression ordering regression

## Task Commits

Each task was committed atomically:

1. **Task 1: Update PdfQualityLevel type and PdfProcessingResult** - `bb33883` (feat)
2. **Task 2: Rewrite pdfProcessor.ts with GS invocation, pre-scan, quality mapping** - `d12a0f5` (feat)
3. **Task 3: Update pdfProcessor tests** - `9edc3a1` (feat)

## Files Created/Modified

- `src/types/file.ts` — `PdfQualityLevel` → intent labels; `PdfProcessingResult` + `imageCount` + `compressibilityScore`
- `src/lib/pdfProcessor.ts` — `invoke('compress_pdf')`, `QUALITY_TO_GS_PRESET`, `scanPdfImages()`, `recommendQualityForTarget()`, `getPdfImageCount()`
- `src/lib/__tests__/pdfProcessor.test.ts` — GS mocks via `mockCompressPdf()`, [PC-02/PC-03] ratio test, [PC-REGRESSION-01], [PC-RESIZE-COMPRESS-01], quality label updates throughout
- `src/test/setup.ts` — `@tauri-apps/api/path` mock (tempDir + join), `remove: vi.fn()` in plugin-fs mock

## Decisions Made

- **Type-safe pdf-lib scan**: Used `Resources()` + `lookupMaybe()` API instead of the `.get()?.resolve()` chain from the plan — `PDFObject` has no `resolve()` method; `lookupMaybe` handles ref resolution correctly and is type-safe.
- **Dimension tests with `compressionEnabled: false`**: Tests calling `getPageDimensions(result.bytes)` were failing because the GS mock output (header bytes only) is not a parseable PDF. Set `compressionEnabled: false` for those tests — they verify resize geometry, not compression, so the fix is correct and preserves test intent.
- **Resize + compression ordering**: `pdfDoc.save({ useObjectStreams: false })` when `resizeEnabled=true` before passing to GS. The plan was clear on this; the `[PC-RESIZE-COMPRESS-01]` test guards the regression.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Type-safe pdf-lib XObject scan (`.resolve()` not on PDFObject)**
- **Found during:** Task 2 (pdfProcessor.ts implementation)
- **Issue:** Plan's `scanPdfImages` code used `.get()?.resolve()?.get()?.resolve()` chain but `PDFObject` has no `resolve()` method — TypeScript error TS2339
- **Fix:** Rewrote scan using `page.node.Resources()` + `lookupMaybe(PDFName.of('XObject'), PDFDict)` + `lookupMaybe(key, PDFStream)` → `stream.dict.lookupMaybe(Subtype, PDFName)` — proper typed API
- **Files modified:** `src/lib/pdfProcessor.ts`
- **Verification:** `npx tsc --noEmit` shows no errors in pdfProcessor.ts; 49 pdfProcessor tests pass
- **Committed in:** `d12a0f5` (Task 2 commit)

**2. [Rule 1 - Bug] Dimension tests broke with compressionEnabled=true (GS mock output not parseable)**
- **Found during:** Task 3 (test execution)
- **Issue:** Tests calling `getPageDimensions(result.bytes)` failed — `result.bytes` is now the GS mock output (`%PDF-` + zeros), which pdf-lib cannot parse as a valid document
- **Fix:** Added `compressionEnabled: false` to 9 resize dimension tests (PR-01–PR-06, content-rich resize, fixture resize, page-selection tests) — these tests verify resize geometry, not compression
- **Files modified:** `src/lib/__tests__/pdfProcessor.test.ts`
- **Verification:** `npm test` → all 194 tests pass
- **Committed in:** `9edc3a1` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug fixes)
**Impact on plan:** Both fixes necessary for correctness. No scope creep. Plan intent fully preserved.

## Issues Encountered

- `PDFDict` and `PDFStream` needed to be imported from `pdf-lib` (not in plan's import list) — added to resolve the type-safe scan implementation
- `@tauri-apps/api/path` needed a mock in `setup.ts` (dynamic imports in pdfProcessor.ts for `tempDir` and `join`) — added as part of Task 3

## User Setup Required

None - no external service configuration required. The GS sidecar from Plan 01 is used; no new setup needed.

## Next Phase Readiness

- `processPdf` calls `invoke('compress_pdf')` with correct preset when `compressionEnabled=true`
- `PdfQualityLevel` is now `'web'|'screen'|'print'|'archive'` — Plan 05-03 must update `ConfigureStep.tsx` (has type errors) and `CompareStep.test.tsx` mock fixture
- `imageCount` and `compressibilityScore` are in every `PdfProcessingResult` — UI can display these in Plan 05-03
- All 194 tests green; TypeScript errors only in UI files that will be fixed in 05-03

## Self-Check: PASSED

- FOUND: `.planning/phases/05-pdf-real-compression-critical/05-02-SUMMARY.md`
- FOUND: commit `bb33883` (Task 1 — PdfQualityLevel type update)
- FOUND: commit `d12a0f5` (Task 2 — pdfProcessor.ts GS invocation rewrite)
- FOUND: commit `9edc3a1` (Task 3 — pdfProcessor tests update)
- All 194 tests pass (`npm test`)
- TypeScript errors only in UI files (ConfigureStep.tsx, CompareStep.test.tsx) — expected, fixed in 05-03

---
*Phase: 05-pdf-real-compression-critical*
*Completed: 2026-02-23*
