---
phase: 16-pdf-editor-gs-bundling
plan: 05
subsystem: ui
tags: [react, pdf-editor, sidebar, pdf-lib, pdfjs, lucide, tauri-invoke]

# Dependency graph
requires:
  - phase: 16-02
    provides: EditorCanvas, ZoomToolbar, EditorView layout, EditorContext
provides:
  - Collapsible tool sidebar with icon strip and expandable panels
  - Before/after preview thumbnails for inline tool application
  - Inline panels for all 12 PDF tools (compress, rotate, watermark, page-numbers, crop, organize, sign, redact, pdfa, repair, protect, unlock)
  - EDITOR_SIDEBAR_TOOLS constant for editor-scoped tool filtering
  - renderPdfPageThumbnail for single-page rendering
affects: [16-06, 16-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [useDebouncedPreview hook for live tool preview, temp-file invoke pattern for GS-backed tools]

key-files:
  created:
    - src/components/pdf-editor/ToolSidebar.tsx
    - src/components/pdf-editor/ToolSidebarPanel.tsx
    - src/components/pdf-editor/ToolSidebarPreview.tsx
  modified:
    - src/types/tools.ts
    - src/lib/pdfThumbnail.ts
    - src/components/pdf-editor/EditorView.tsx

key-decisions:
  - "useDebouncedPreview custom hook for 500ms debounced live preview of pdf-lib tools"
  - "Compress/pdfa/repair/protect/unlock use temp-file + Tauri invoke (no live preview) due to GS overhead"
  - "Sign and redact show placeholder panels -- require canvas interaction not yet wired"
  - "Organize panel shows hint to use Page Panel instead of duplicating functionality"

patterns-established:
  - "Tool panel pattern: PanelHeader + settings form + ToolSidebarPreview + ApplyButton"
  - "useApply hook for consistent Apply button state (loading, success, error)"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 16 Plan 05: Tool Sidebar Summary

**Collapsible right sidebar with 12 PDF tool panels, debounced before/after preview, and inline apply-to-document workflow**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T08:52:29Z
- **Completed:** 2026-03-17T08:57:39Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built VS Code-style icon strip sidebar with 12 PDF tool icons, tooltip on hover, active border highlight
- Implemented inline settings panels with before/after preview for rotate, watermark, page-numbers, crop (live debounced preview)
- Implemented Tauri invoke panels for compress, pdfa-convert, repair, protect, unlock (write temp file, invoke GS, apply result)
- Wired ToolSidebar into EditorView replacing the right panel placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: ToolSidebar icon strip and expandable panel** - `8cfa746` (feat)
2. **Task 2: Wire remaining tool panels and EditorView integration** - `4dce9de` (feat)

## Files Created/Modified
- `src/components/pdf-editor/ToolSidebar.tsx` - Icon strip with collapse/expand, tool selection toggle
- `src/components/pdf-editor/ToolSidebarPanel.tsx` - Router + 12 inline tool panels with settings, preview, Apply
- `src/components/pdf-editor/ToolSidebarPreview.tsx` - Side-by-side before/after page thumbnail rendering
- `src/types/tools.ts` - Added EDITOR_SIDEBAR_TOOLS constant
- `src/lib/pdfThumbnail.ts` - Added renderPdfPageThumbnail for single page by index
- `src/components/pdf-editor/EditorView.tsx` - Replaced right placeholder with ToolSidebar

## Decisions Made
- useDebouncedPreview custom hook encapsulates the debounced preview pipeline (500ms delay) for pdf-lib tools, keeping each panel component clean
- GS-backed tools (compress, pdfa, repair, protect, unlock) skip live preview due to performance cost of writing temp files and invoking Ghostscript -- they apply directly on button click
- Sign and redact panels show informational placeholders since they require canvas-level interaction (drawing rectangles, placing signatures) not yet available in the sidebar context
- Organize panel shows a "Use Page Panel" hint rather than duplicating page reorder UI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added renderPdfPageThumbnail to pdfThumbnail.ts**
- **Found during:** Task 1
- **Issue:** Plan referenced renderPdfPageThumbnail but it did not exist -- only renderPdfThumbnail (first page) and renderAllPdfPages were available
- **Fix:** Added renderPdfPageThumbnail(pdfBytes, pageIndex, scale) function
- **Files modified:** src/lib/pdfThumbnail.ts
- **Verification:** TypeScript compiles, function used by ToolSidebarPreview
- **Committed in:** 8cfa746

**2. [Rule 1 - Bug] Fixed useRef strict mode argument**
- **Found during:** Task 1
- **Issue:** useRef<ReturnType<typeof setTimeout>>() without initial value fails in strict TypeScript
- **Fix:** Changed to useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
- **Files modified:** src/components/pdf-editor/ToolSidebarPanel.tsx
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 8cfa746

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Tool sidebar is fully wired into the editor layout
- All PDF tools accessible inline with consistent panel pattern
- Sign and redact tools need canvas-level interaction support (future plan)
- Ready for remaining Phase 16 plans (page panel, save/export)

---
*Phase: 16-pdf-editor-gs-bundling*
*Completed: 2026-03-17*
