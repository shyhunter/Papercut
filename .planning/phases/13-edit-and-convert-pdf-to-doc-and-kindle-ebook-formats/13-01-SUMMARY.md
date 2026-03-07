---
phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats
plan: 01
subsystem: foundation
tags: [tauri, rust, typescript, libreoffice, calibre, pdf-editing, document-conversion]

# Dependency graph
requires:
  - phase: 09-dashboard-tool-architecture
    provides: "TOOL_REGISTRY pattern, ToolId, ToolCategory, Dashboard groupByCategory"
provides:
  - "EditorState, TextBlock, ImageBlock types for PDF editor UI"
  - "ConvertFormat, ConvertOptions, ConvertResult types for conversion flow"
  - "edit-pdf and convert-doc TOOL_REGISTRY entries"
  - "Extended format detection for docx, doc, odt, epub, mobi, azw3, txt, rtf"
  - "convert_with_libreoffice Rust command (system binary invocation)"
  - "convert_with_calibre Rust command (system binary invocation)"
affects: [13-02, 13-03, 13-04, 13-05]

# Tech tracking
tech-stack:
  added: [libreoffice (system), calibre (system)]
  patterns: [shell().command() for system binaries vs shell().sidecar() for bundled binaries]

key-files:
  created:
    - src/types/editor.ts
    - src/types/converter.ts
  modified:
    - src/types/tools.ts
    - src/types/file.ts
    - src/lib/fileValidation.ts
    - src-tauri/src/lib.rs
    - src-tauri/capabilities/default.json
    - src/components/Dashboard.tsx

key-decisions:
  - "shell().command() for LibreOffice/Calibre (system-installed, too large to bundle ~200-500MB each)"
  - "macOS path fallback for soffice and ebook-convert (app bundle paths differ from PATH)"
  - "'document' as third SupportedFormat alongside 'pdf' and 'image'"

patterns-established:
  - "System binary invocation: shell().command() with macOS app bundle path fallback"
  - "Format engine routing: DOCUMENT_FORMATS for LibreOffice, EBOOK_FORMATS for Calibre"

requirements-completed: [EDIT-01, CONV-01, CONV-02]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 13 Plan 01: Foundation Summary

**Type definitions, format detection, tool registry, and Rust sidecar commands for PDF editing and document/ebook conversion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T15:07:22Z
- **Completed:** 2026-03-07T15:09:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created editor.ts and converter.ts type definitions for downstream PDF editor and conversion UIs
- Extended format detection and TOOL_REGISTRY with edit-pdf and convert-doc tools
- Added Rust commands for LibreOffice and Calibre system binary invocation with input validation and macOS path fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Type definitions, format detection, and tool registry** - `4c77638` (feat)
2. **Task 2: Rust sidecar commands for LibreOffice and Calibre** - `48c6532` (feat)

## Files Created/Modified

- `src/types/editor.ts` - TextBlock, ImageBlock, PageEditState, EditorState, EditorMode types
- `src/types/converter.ts` - ConvertFormat, ConvertOptions, ConvertResult, DOCUMENT_FORMATS, EBOOK_FORMATS
- `src/types/tools.ts` - Added edit-pdf and convert-doc to ToolId, document to ToolCategory
- `src/types/file.ts` - Added 'document' to SupportedFormat union
- `src/lib/fileValidation.ts` - Extended format detection for document/ebook extensions
- `src-tauri/src/lib.rs` - convert_with_libreoffice and convert_with_calibre commands
- `src-tauri/capabilities/default.json` - shell:allow-execute for soffice and ebook-convert
- `src/components/Dashboard.tsx` - Added document category and FileEdit icon

## Decisions Made

- Used `shell().command()` (not `shell().sidecar()`) for LibreOffice and Calibre since they are system-installed binaries too large to bundle (200-500MB each)
- Added macOS application bundle path fallback for both soffice and ebook-convert
- Introduced 'document' as third SupportedFormat alongside 'pdf' and 'image'

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dashboard.tsx needed 'document' category support**
- **Found during:** Task 1 (TypeScript type check)
- **Issue:** Adding 'document' to ToolCategory broke Dashboard.tsx Record<ToolCategory, ...> types
- **Fix:** Added 'document' to CATEGORY_LABELS, CATEGORY_ORDER, groupByCategory initial groups, and imported FileEdit icon
- **Files modified:** src/components/Dashboard.tsx
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 4c77638 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for type correctness. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. LibreOffice and Calibre are system-installed dependencies that users must have separately.

## Next Phase Readiness

- All shared type definitions available for Plans 02-05
- Rust commands ready for TypeScript wrapper integration
- TOOL_REGISTRY entries enable Dashboard rendering of new tools
- Format detection supports document file drops

---
*Phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats*
*Completed: 2026-03-07*

## Self-Check: PASSED

All 8 files verified present, both commit hashes found, all content markers confirmed.
