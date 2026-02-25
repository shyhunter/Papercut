---
phase: 05-pdf-real-compression-critical
plan: 03
subsystem: ui
tags: [react, typescript, pdf-compression, configure-step, compare-step, ghostscript, vitest]

# Dependency graph
requires:
  - phase: 05-pdf-real-compression-critical
    provides: "Plan 02 — PdfQualityLevel renamed to web/screen/print/archive, recommendQualityForTarget export, imageCount + compressibilityScore on PdfProcessingResult"
  - phase: 02-pdf-processing
    provides: "ConfigureStep.tsx and CompareStep.tsx base components"

provides:
  - "ConfigureStep quality labels: Web / Screen / Print / Archive (intent-based, matching GS presets)"
  - "ConfigureStep default quality: 'screen' (not 'medium')"
  - "Target-driven quality recommendation: target size input auto-suggests quality via recommendQualityForTarget()"
  - "'Suggested' badge on recommended quality tile in ConfigureStep"
  - "CompareStep structural-only notice completely removed"
  - "CompareStep size display: 'X MB -> Y MB (Z% smaller/larger)' format"
  - "CompareStep After-panel render scale derived from quality DPI (web=0.75x, screen=1.0x, print=1.5x, archive=2.0x)"
  - "CompareStep accepts qualityLevel prop; App.tsx threads it through"
  - "CompareStep.test.tsx updated: structural notice tests assert NOT present; stats bar tests match new format"
  - "TEST_PLAN.md Section 2 updated for real GS compression behavior"

affects:
  - "Future UI changes must use intent-based quality labels (Web/Screen/Print/Archive)"
  - "CompareStep consumers must pass qualityLevel prop for correct After-panel render scale"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Target-driven quality recommendation: onChange handler calls recommendQualityForTarget() with neutral 0.5 compressibilityScore as pre-processing hint"
    - "Quality-derived render scale: QUALITY_RENDER_SCALE record maps intent labels to canvas render multipliers"
    - "'Suggested' badge pattern: absolute-positioned span on quality radio tile, driven by recommendedQuality state"

key-files:
  created: []
  modified:
    - "src/components/ConfigureStep.tsx — Web/Screen/Print/Archive labels, screen default, recommendQualityForTarget integration, Suggested badge"
    - "src/components/CompareStep.tsx — structural notice removed, X->Y (Z% smaller) format, qualityLevel prop, quality-derived render scale"
    - "src/App.tsx — lastPdfQualityLevel state, qualityLevel prop passed to CompareStep"
    - "src/components/__tests__/CompareStep.test.tsx — structural notice tests now assert absence, stats bar tests updated to new format, makeResult includes imageCount/compressibilityScore"
    - ".planning/TEST_PLAN.md — PC-02/03 updated for real compression, PC-REGRESSION-01 and pre-scan rows added"

key-decisions:
  - "Neutral compressibilityScore 0.5 used for pre-processing quality hint — real score only available after processing completes"
  - "Before panel always renders at RENDER_SCALE=2.0 (high-res original); only After panel uses quality-derived scale"

patterns-established:
  - "Quality recommendation pattern: target size onChange -> parseSizeInput -> recommendQualityForTarget -> auto-select + show Suggested badge"
  - "QUALITY_RENDER_SCALE record: web=0.75, screen=1.0, print=1.5, archive=2.0"

requirements-completed: [PDF-01, PDF-02, PDF-03, PDF-04]

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 5 Plan 03: PDF UI Update for Real GS Compression Summary

**Intent-based quality labels (Web/Screen/Print/Archive), target-driven quality auto-suggestion, structural-only notice removal, and X->Y percentage size display in CompareStep**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24T10:15:00Z
- **Completed:** 2026-02-24T10:21:04Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- ConfigureStep quality selector updated from Low/Medium/High/Maximum to Web/Screen/Print/Archive with intent-based descriptions and 'screen' as default
- Target size input wired to `recommendQualityForTarget()` — auto-selects quality and shows "Suggested" badge on the recommended tile
- CompareStep structural-only notice ("image content is unchanged") completely removed — no longer applies with real GS compression
- CompareStep stats bar updated from delta format (`-19.5 KB (20%)`) to arrow format (`97.7 KB -> 78.1 KB (20% smaller)`)
- After-panel render scale now reflects quality DPI (web=0.75x through archive=2.0x) instead of fixed 2.0x
- CompareStep.test.tsx fully updated: structural notice tests verify absence only, stats bar tests match new format

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ConfigureStep -- rename quality levels, add target-driven recommendation** - `d98cb23` (feat)
2. **Task 2: Update CompareStep and App.tsx -- remove structural notice, add X->Y size format, quality-derived render scale** - `a2f6920` (feat)
3. **Task 3: Update CompareStep tests and TEST_PLAN.md for real GS compression** - `f1b822c` (feat)

## Files Created/Modified

- `src/components/ConfigureStep.tsx` — Web/Screen/Print/Archive labels, 'screen' default, recommendQualityForTarget import + call, Suggested badge, neutral hint text replacing structural disclaimer
- `src/components/CompareStep.tsx` — structural notice block deleted, stats bar `X -> Y (Z% smaller/larger)` format, qualityLevel prop, QUALITY_RENDER_SCALE map, getAfterRenderScale()
- `src/App.tsx` — lastPdfQualityLevel state added, qualityLevel prop threaded to CompareStep
- `src/components/__tests__/CompareStep.test.tsx` — makeResult() adds imageCount/compressibilityScore, structural notice describe block renamed to "must not appear", stats bar assertions updated to new format
- `.planning/TEST_PLAN.md` — PC-02/03 updated for real GS quality differences, Known Limitation removed, PC-REGRESSION-01 and pre-scan rows added

## Decisions Made

- Used neutral `compressibilityScore` of 0.5 in the pre-processing quality hint (real score only available after GS processes the PDF)
- Before panel always renders at fixed 2.0x scale; only After panel uses quality-derived scale to reflect actual output resolution
- Structural-only notice removed without replacement text (per CONTEXT.md: "no replacement text needed")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 is now complete: all 3 plans executed (GS sidecar + TS pipeline + UI update)
- All Phase 5 success criteria met: quality levels produce different output, text-only PDFs still work, structural notice removed, percentage display added
- Ready for Phase 6 (Safety & Hardening) or Phase 7 (E2E Tests)

## Self-Check: PASSED

- FOUND: `src/components/ConfigureStep.tsx`
- FOUND: `src/components/CompareStep.tsx`
- FOUND: `src/components/__tests__/CompareStep.test.tsx`
- FOUND: `.planning/phases/05-pdf-real-compression-critical/05-03-SUMMARY.md`
- FOUND: commit `d98cb23` (Task 1 -- ConfigureStep quality labels)
- FOUND: commit `a2f6920` (Task 2 -- CompareStep + App.tsx updates)
- FOUND: commit `f1b822c` (Task 3 -- CompareStep tests + TEST_PLAN.md)

---
*Phase: 05-pdf-real-compression-critical*
*Completed: 2026-02-24*
