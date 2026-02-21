---
phase: 03-image-processing
plan: 03
subsystem: ui
tags: [react, typescript, tailwind, lucide-react, image-processing, blob-url, compare-view]

# Dependency graph
requires:
  - phase: 03-image-processing
    plan: 02
    provides: useImageProcessor hook, ImageConfigureStep, ImageProcessingResult type with bytes/sourceBytes/sourceWidth/sourceHeight
  - phase: 02-pdf-processing
    plan: 03
    provides: SaveStep component (reused with new optional props)
provides:
  - ImageCompareStep with side-by-side Before/After panels, stale-result regenerating overlay, zoom (50-200%), and stats bar
  - SaveStep extended with defaultSaveName and saveFilters props for image-specific OS dialog
  - Complete image processing flow in App.tsx: Configure → Compare → Save, end-to-end
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Blob URL lifecycle management via useEffect with URL.revokeObjectURL cleanup (prevents memory leaks on re-processing)
    - detectMimeFromBytes magic-byte detection for JPEG (0xFF 0xD8), PNG (0x89 0x50), WebP (0x57 0x45 0x42 0x50 at offset 8)
    - Stale-result overlay: isProcessing=true + processedUrl already set → show stale image at opacity-40 + Regenerating badge
    - Optional-prop extension pattern on SaveStep: defaultSaveName and saveFilters both ?? fallback to preserve PDF backward compat

key-files:
  created:
    - src/components/ImageCompareStep.tsx
  modified:
    - src/components/SaveStep.tsx
    - src/App.tsx

key-decisions:
  - "Blob URLs created in separate useEffect per image (source vs processed) — source deps on result.sourceBytes, processed deps on result.bytes + result.outputFormat"
  - "Stale overlay shown when isProcessing=true AND processedUrl already exists — never blank screen between regeneration cycles"
  - "SaveStep extended with optional defaultSaveName and saveFilters — ?? fallback keeps PDF callers unaffected"
  - "buildImageSaveFileName replaces .jpeg with .jpg extension (jpeg format → jpg file extension convention)"
  - "handleBackFromCompare does NOT reset imageProcessor — stale result intentionally preserved for regenerating overlay"

patterns-established:
  - "ImageCompareStep mirrors CompareStep bottom-strip layout: Back | stats | zoom controls | Process another | Save…"
  - "ZOOM_STEPS array (50/75/100/150/200%) shared pattern — copy-paste from CompareStep, not extracted to shared util yet"

requirements-completed: [IMG-04]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 3 Plan 03: ImageCompareStep Summary

**Side-by-side image compare with Blob URL memory management, stale-result regenerating overlay, zoom, stats bar, and complete image flow (Configure → Compare → Save) wired in App.tsx**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-21T15:38:13Z
- **Completed:** 2026-02-21T15:43:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ImageCompareStep.tsx with side-by-side Before/After panels using Blob URLs from ImageProcessingResult.sourceBytes and .bytes
- Stale-result overlay implemented: while isProcessing=true and a previous processedUrl exists, stale image shows at opacity-40 with "Regenerating…" badge — no blank screen between regeneration cycles
- Stats bar shows: size delta (green for reduction, amber for growth), conditional dimensions (only when changed), conditional format label (only when converted), quality display (% for JPEG/WebP, Compression N/9 for PNG)
- SaveStep extended with optional defaultSaveName and saveFilters props — ?? fallback preserves full PDF backward compatibility
- App.tsx completed image flow: buildImageSaveFileName/buildImageSaveFilters helpers, image SaveStep block at step 3, PDF format guard on existing step-3 PDF block

## Task Commits

Each task was committed atomically:

1. **Task 1: ImageCompareStep component** - `fdc2d48` (feat)
2. **Task 2: App.tsx and SaveStep — complete image flow** - `cfa7fbf` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/ImageCompareStep.tsx` — Side-by-side image compare with Blob URL lifecycle, stale-result overlay, zoom (50/75/100/150/200%), stats bar, and action strip (Back / stats / zoom / Process another / Save…)
- `src/components/SaveStep.tsx` — Added optional `defaultSaveName` and `saveFilters` props; ?? fallback preserves PDF backward compatibility
- `src/App.tsx` — Added buildImageSaveFileName, buildImageSaveFilters helpers; wired ImageCompareStep at step 2 for image format; added image SaveStep block at step 3; added format guard to PDF SaveStep block

## Decisions Made
- Source and processed Blob URLs each have their own useEffect with URL.revokeObjectURL in cleanup — avoids leaking Blob object URLs when result updates after re-processing
- detectMimeFromBytes inspects raw bytes (magic numbers): 0xFF 0xD8 → JPEG, 0x89 0x50 → PNG, WebP RIFF check at byte offset 8 → WebP; fallback to image/jpeg
- Stale result intentionally preserved in handleBackFromCompare — imageProcessor is NOT reset on Back so ImageCompareStep shows the stale overlay immediately when the user re-generates
- buildImageSaveFileName maps 'jpeg' outputFormat to '.jpg' file extension (convention: jpeg format written to .jpg file)
- ZOOM_STEPS array duplicated from CompareStep (not extracted to shared util) — shared zoom util is a low-priority refactor, defer to polish phase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 complete: IMG-01 through IMG-04 all implemented (quality slider, resize, format conversion, side-by-side compare)
- Full image workflow functional end-to-end: open image → Configure → Compare (with stale overlay) → Save (correct OS dialog filter per format)
- PDF flow unaffected: existing SaveStep PDF callers pass neither optional prop and continue to use "PDF Document" filter
- Ready for human verification checkpoint (Task 3) — run `npm run tauri dev` and test all 18 scenarios in the PLAN

## Self-Check: PASSED

Files verified:
- `src/components/ImageCompareStep.tsx` — FOUND
- `src/components/SaveStep.tsx` — FOUND (with optional props)
- `src/App.tsx` — FOUND (with image flow wired)

Commits verified:
- `fdc2d48` — FOUND (feat(03-03): add ImageCompareStep with stale-result overlay, zoom, and stats)
- `cfa7fbf` — FOUND (feat(03-03): wire ImageCompareStep and image SaveStep into App.tsx; fix stale overlay)

TypeScript: zero errors (npx tsc --noEmit passed clean)

---
*Phase: 03-image-processing*
*Completed: 2026-02-21*
