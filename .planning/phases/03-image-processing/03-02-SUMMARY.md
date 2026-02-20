---
phase: 03-image-processing
plan: 02
subsystem: ui
tags: [react, typescript, tailwind, lucide-react, image-processing, form]

# Dependency graph
requires:
  - phase: 03-image-processing
    plan: 01
    provides: useImageProcessor hook, ImageProcessingOptions/ImageProcessingResult types
affects:
  - 03-03-image-compare-save-step (consumes imageProcessor.result, ImageProcessingResult.bytes/sourceBytes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mouse-up only slider pattern: onChange updates visual state only; onMouseUp/onTouchEnd fires actual processing
    - PNG quality-to-compression remapping: quality 1-100 inverted to compression 0-9 via (100-q)*9/100 in UI label
    - Aspect ratio lock with derived ratio from lastResult.sourceWidth/sourceHeight
    - Preset-fills-then-user-fine-tunes pattern for resize presets

key-files:
  created:
    - src/components/ImageConfigureStep.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "Slider fires handleSubmit on onMouseUp and onTouchEnd — same function as Generate Preview button"
  - "PNG compression label: compressionDisplay = Math.round((100 - quality) * 9 / 100) computed in UI"
  - "Preset selection always sets unit to pixels (even if percentage mode active) for predictable dimensions"
  - "fileSizeBytes passed as 0 from App.tsx — FileEntry lacks sizeBytes; component hides size display when 0"
  - "resizeExact: true always — user controls both dimensions explicitly; server handles exact sizing"

patterns-established:
  - "ImageConfigureStep mirrors ConfigureStep layout: card-per-section, pill toggle for resize, same action row"
  - "Aspect ratio lock icon position: inline with Height label (not Width) for natural reading order"

requirements-completed: [IMG-01, IMG-02, IMG-03]

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 3 Plan 02: ImageConfigureStep Summary

**Quality slider with mouse-up-only processing trigger, PNG compression remapping, format selector, resize toggle with W x H inputs, aspect ratio lock, and 4 presets — fully wired into App.tsx image routing via useImageProcessor**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T22:39:39Z
- **Completed:** 2026-02-20T22:42:39Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created ImageConfigureStep.tsx with all LOCKED UX decisions from CONTEXT.md implemented
- Quality slider fires on mouse-up only (onChange updates visual only; onMouseUp/onTouchEnd calls handleSubmit)
- PNG output remaps slider to compression 0-9 with updated label ("Compression: N/9 — ~X KB")
- Format selector (JPG | PNG | WebP) always visible, switching instantly relabels slider
- Resize toggle (off by default) reveals unit toggle (pixels/percentage), 4 presets, W x H inputs, aspect ratio lock
- Lock icon (lucide-react Lock/Unlock) beside Height label; locked = one dimension recalculates the other
- App.tsx: useImageProcessor added, image routing at step 1, placeholder compare view at step 2 with output size

## Task Commits

Each task was committed atomically:

1. **Task 1: ImageConfigureStep component** - `3a95486` (feat)
2. **Task 2: App.tsx — useImageProcessor and image routing** - `ac536d0` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/components/ImageConfigureStep.tsx` - Full image configuration UI: quality slider, format selector, resize section with presets and aspect ratio lock
- `src/App.tsx` - Added useImageProcessor, handleGenerateImagePreview, image routing at step 1 and 2, detectImageFormat helper, formatBytes helper

## Decisions Made
- Slider's `onMouseUp` and `onTouchEnd` both call `handleSubmit` directly (same function as Generate Preview button) — single code path for processing trigger
- PNG compression display uses `Math.round((100 - quality) * 9 / 100)` in the UI label — mirrors the Rust formula from plan 03-01
- Preset selection forces unit to "pixels" and clears W/H inputs — avoids ambiguous percentage-to-preset conversion when no lastResult exists
- `fileSizeBytes={0}` passed from App.tsx — FileEntry type has no sizeBytes field; component already handles this gracefully by hiding the size display
- `resizeExact: true` always — the user explicitly controls both W and H; Rust handles the exact sizing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ImageConfigureStep fully functional: opens image files, shows configure UI, fires imageProcessor.run() on submit
- imageProcessor.result.bytes and .sourceBytes ready for the ImageCompareStep Before/After panels (plan 03-03)
- Step 2 placeholder shows output size and Back button — plan 03-03 replaces it with full side-by-side compare

## Self-Check: PASSED

---
*Phase: 03-image-processing*
*Completed: 2026-02-20*
