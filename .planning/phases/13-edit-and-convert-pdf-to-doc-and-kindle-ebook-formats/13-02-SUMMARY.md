---
phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats
plan: 02
subsystem: ui
tags: [react, typescript, libreoffice, calibre, document-conversion, tauri]

# Dependency graph
requires:
  - phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats
    provides: "ConvertFormat, ConvertOptions, ConvertResult types, Rust sidecar commands, TOOL_REGISTRY entries"
provides:
  - "convertDocument() orchestrator routing to LibreOffice or Calibre"
  - "getAvailableOutputFormats() format availability matrix"
  - "checkSidecarAvailability() cached engine detection"
  - "ConvertDocFlow: Pick -> Configure -> Compare -> Save step flow"
  - "ConvertConfigStep: format grid, EPUB layout, typography controls"
  - "ConvertCompareStep: file size comparison with format badges"
  - "App.tsx convert-doc routing"
affects: [13-03, 13-04, 13-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [engine-routed conversion via ConvertOptions, sidecar availability check with session cache]

key-files:
  created:
    - src/lib/documentConverter.ts
    - src/components/convert-doc/ConvertPickStep.tsx
    - src/components/convert-doc/ConvertConfigStep.tsx
    - src/components/convert-doc/ConvertCompareStep.tsx
    - src/components/convert-doc/ConvertDocFlow.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "Typography controls (font, margins, spacing) shown only for Calibre-routed conversions -- LibreOffice does not accept those flags"
  - "Linked margins toggle defaults ON for uniform margin editing"
  - "Sidecar availability probe uses dummy path invoke -- error message differentiation detects binary presence"

patterns-established:
  - "ConvertDocFlow: self-contained flow with internal step state (0-3), follows ConvertImageFlow pattern"
  - "Engine-conditional UI: showTypographyControls gates sections based on getEngineForFormat()"

requirements-completed: [CONV-01, CONV-02, CONV-03, CONV-04]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 13 Plan 02: Convert Document Tool Summary

**Complete Convert Document flow with bidirectional format conversion via LibreOffice/Calibre, typography controls, and file size comparison**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T19:08:07Z
- **Completed:** 2026-03-07T19:11:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created document converter orchestrator with engine routing, Calibre CLI arg builder, and cached sidecar availability check
- Built complete Convert Document UI: pick step with document format filter, config step with format grid and conditional typography controls, compare step with file size comparison
- Wired convert-doc routing in App.tsx following existing dedicated flow pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Document converter orchestrator library** - `84a6202` (feat)
2. **Task 2: Convert Document flow UI and App.tsx routing** - `25448ca` (feat)

## Files Created/Modified

- `src/lib/documentConverter.ts` - Conversion orchestrator: engine routing, Calibre args, format matrix, sidecar check
- `src/components/convert-doc/ConvertPickStep.tsx` - File picker with document format filter (PDF, DOCX, DOC, ODT, EPUB, TXT, RTF)
- `src/components/convert-doc/ConvertConfigStep.tsx` - Output format selector, EPUB layout toggle, font/margin/spacing controls
- `src/components/convert-doc/ConvertCompareStep.tsx` - Original vs converted file size comparison with format badges
- `src/components/convert-doc/ConvertDocFlow.tsx` - Step flow controller (Pick -> Configure -> Compare -> Save)
- `src/App.tsx` - Added convert-doc routing and ConvertDocFlow import

## Decisions Made

- Typography controls (font family, font size, margins, line spacing) only shown for Calibre-routed ebook conversions since LibreOffice does not accept those CLI flags
- Linked margins toggle defaults to ON for simpler uniform margin editing
- Sidecar availability check probes via dummy path invoke and differentiates "not found" errors from other errors to detect binary presence
- Fixed unused `sourceFormat` parameter in `convertDocument()` (prefixed with underscore)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused parameter TypeScript error in documentConverter.ts**
- **Found during:** Task 1
- **Issue:** `sourceFormat` parameter declared but never used -- TS6133 error
- **Fix:** Prefixed with underscore (`_sourceFormat`) to indicate intentionally unused
- **Files modified:** src/lib/documentConverter.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 84a6202 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial fix for TypeScript strictness. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - LibreOffice and Calibre are system-installed dependencies that users must have separately.

## Next Phase Readiness

- Convert Document tool fully functional end-to-end
- Plans 03-05 can build on this for PDF text extraction, edit-pdf flow, and in-editor conversion panel
- SaveStep reuse pattern confirmed working with custom save names and format filters

---
*Phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats*
*Completed: 2026-03-07*

## Self-Check: PASSED

All 5 created files verified present, both commit hashes found.
