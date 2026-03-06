---
phase: 12-advanced-pdf-tools
plan: 02
subsystem: pdf-tools
tags: [pdf, ghostscript, pdfa, repair, tauri-commands]

requires:
  - phase: 09-multi-tool-dashboard
    provides: "SaveStep, StepErrorBoundary, ToolContext"
provides:
  - "convert_pdfa Tauri command with PDFA_def.ps generation"
  - "repair_pdf Tauri command with partial success handling"
  - "PdfaConvertFlow UI with 3 conformance levels"
  - "RepairPdfFlow UI with file health detection"
affects: [12-04-sign-pdf-flow]

tech-stack:
  patterns: [gs-sidecar-pdfa, gs-sidecar-repair, partial-success-handling]

key-files:
  created:
    - src/components/pdfa-convert/PdfaConvertFlow.tsx
    - src/components/repair-pdf/RepairPdfFlow.tsx
  modified:
    - src-tauri/src/lib.rs

key-decisions:
  - "convert_pdfa generates a temp PDFA_def.ps with pdfmark metadata for GS"
  - "repair_pdf returns bytes on partial success (non-zero exit but output exists)"
  - "Both flows show file size comparison in save step"
  - "RepairPdfFlow detects healthy files via size similarity check (<5% difference)"

patterns-established:
  - "GS sidecar pattern extended: PDFA conversion with level param and PostScript definition file"
  - "Partial success pattern: repair returns bytes even on non-zero GS exit if output file has content"

requirements-completed: [SC-03, SC-04]

duration: 4min
completed: 2026-03-06
---

# Phase 12 Plan 02: PDF/A Convert + Repair PDF Summary

**Added convert_pdfa and repair_pdf Rust commands with complete flow UIs for both tools**

## Performance

- **Duration:** ~4 min
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- convert_pdfa command generates PDFA_def.ps and invokes GS with -dPDFA={level} for 3 conformance levels
- repair_pdf command handles partial GS success (non-zero exit with output file)
- PdfaConvertFlow: pick -> select conformance level (1b/2b/3b) -> convert -> save with size comparison
- RepairPdfFlow: pick -> info panel -> repair -> save with health detection note

## Task Commits

1. **Task 1: Add convert_pdfa and repair_pdf Rust commands** - `47cc841` (feat)
2. **Task 2: PDF/A Convert flow UI** - `40d1087` (feat)
3. **Task 3: Repair PDF flow UI** - committed as part of 40d1087

## Files Created/Modified
- `src-tauri/src/lib.rs` - Added convert_pdfa and repair_pdf Tauri commands with GS sidecar invocation
- `src/components/pdfa-convert/PdfaConvertFlow.tsx` - PDF/A conversion flow with conformance level selector
- `src/components/repair-pdf/RepairPdfFlow.tsx` - Repair PDF flow with health detection and partial success handling

## Decisions Made
- PDFA_def.ps generated dynamically in temp dir with correct pdfmark metadata
- Repair partial success: if GS exits non-zero but output file exists with content, return bytes as success
- File health detection: compare repaired size to original (within 5% = likely healthy)
- Both tools follow pick -> configure/info -> save pattern consistent with protect-pdf

## Deviations from Plan

None significant — all 3 tasks executed as planned.

## Issues Encountered
Agent hit rate limit before creating summary (summary created by orchestrator).

---
*Phase: 12-advanced-pdf-tools*
*Completed: 2026-03-06*
