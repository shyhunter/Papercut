---
phase: 12-advanced-pdf-tools
plan: 03
subsystem: ui
tags: [pdf, signature, canvas, fonts, tauri-store, react]

requires:
  - phase: 12-advanced-pdf-tools
    provides: "Signature fonts (Dancing Script, Caveat, Great Vibes) and tool routing"
provides:
  - "SignatureCanvas: freehand drawing component with smooth Bezier lines and cropped PNG export"
  - "SignatureTyped: typed text with 4 font choices and auto-sized canvas export"
  - "SignatureUpload: image picker with resize and PNG conversion"
  - "useSavedSignatures: persistent signature storage via tauri-plugin-store (max 10)"
  - "SignatureCreateStep: unified tab-based UI for creation and saved signature selection"
affects: [12-04-sign-pdf-placement]

tech-stack:
  added: []
  patterns: [canvas-freehand-bezier, offscreen-canvas-text-render, cropped-png-export]

key-files:
  created:
    - src/components/sign-pdf/SignatureCanvas.tsx
    - src/components/sign-pdf/SignatureTyped.tsx
    - src/components/sign-pdf/SignatureUpload.tsx
    - src/components/sign-pdf/SignatureCreateStep.tsx
    - src/hooks/useSavedSignatures.ts
  modified: []

key-decisions:
  - "Canvas freehand uses quadraticCurveTo with point averaging for smooth lines, capped at 2x DPR"
  - "All three creation methods crop to bounding box before PNG export to minimize embedded image size"
  - "SignatureTyped auto-calculates font size to fit text within 600px canvas width"
  - "useSavedSignatures shares LazyStore instance with useRecentDirs (same papercut-settings.json file)"

patterns-established:
  - "Cropped PNG export: scan pixel alpha to find bounding box, draw to temp canvas, export as data URL"
  - "Signature creation pipeline: component fires onComplete(dataUrl) -> parent prompts for name -> saves to store -> proceeds"

requirements-completed: [SC-01]

duration: 3min
completed: 2026-03-06
---

# Phase 12 Plan 03: Signature Creation Step Summary

**Three signature creation methods (draw/type/upload) with persistent saved signatures via tauri-plugin-store and unified tab-based selection UI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T16:03:42Z
- **Completed:** 2026-03-06T16:07:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Freehand canvas drawing with Bezier smoothing, touch support, and cropped PNG export
- Typed signature with 4 font options (Dancing Script, Caveat, Great Vibes, monospace) and auto-sizing
- Image upload via Tauri dialog with resize-to-fit and PNG conversion
- Persistent signature storage (max 10) with save/delete/load via LazyStore
- Unified SignatureCreateStep with saved signatures grid and tabbed creation interface

## Task Commits

Each task was committed atomically:

1. **Task 1: Signature creation components (Canvas, Typed, Upload)** - `7bf2a0c` (feat)
2. **Task 2: useSavedSignatures hook and SignatureCreateStep** - `6f174f2` (feat)

## Files Created/Modified
- `src/components/sign-pdf/SignatureCanvas.tsx` - Freehand drawing pad with DPR-aware canvas, guideline, clear, and cropped PNG export
- `src/components/sign-pdf/SignatureTyped.tsx` - Text input with font selector, live preview, and offscreen canvas rendering
- `src/components/sign-pdf/SignatureUpload.tsx` - Tauri dialog image picker with resize and PNG conversion
- `src/components/sign-pdf/SignatureCreateStep.tsx` - Tab UI (Draw/Type/Upload) with saved signatures grid and inline name prompt
- `src/hooks/useSavedSignatures.ts` - LazyStore-based persistence hook following useRecentDirs pattern

## Decisions Made
- Canvas uses quadraticCurveTo with midpoint averaging (not lineTo) for smooth freehand lines -- standard technique from research
- DPR capped at 2x to avoid excessive memory usage on high-DPI displays (research pitfall 6)
- Paths stored in React state (Point[][]) so canvas redraws correctly on StrictMode remount (research pitfall 4)
- All creation methods crop to content bounding box before export to minimize PNG data URL size
- useSavedSignatures reuses the same LazyStore file (papercut-settings.json) as useRecentDirs -- no separate store file needed
- SignatureUpload uses createImageBitmap for format-agnostic image loading, matching project's existing pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 signature creation methods produce PNG data URLs ready for embedding
- SignatureCreateStep ready to integrate into SignPdfFlow as the signature selection step
- Saved signatures persist across sessions via tauri-plugin-store
- Next plan (placement step) can use onSignatureSelected callback to receive the data URL

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (7bf2a0c, 6f174f2) verified in git log.

---
*Phase: 12-advanced-pdf-tools*
*Completed: 2026-03-06*
