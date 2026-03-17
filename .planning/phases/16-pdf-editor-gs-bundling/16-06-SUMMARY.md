---
phase: 16-pdf-editor-gs-bundling
plan: 06
subsystem: ui
tags: [tauri, file-association, save, keyboard-shortcuts, pdf-editor]

# Dependency graph
requires:
  - phase: 16-pdf-editor-gs-bundling
    provides: "EditorView, EditorContext, EditorCanvas, EditorTopToolbar, ToolSidebar, PagePanel"
provides:
  - "PDF file association for macOS Open With"
  - "CLI argument handling for file-opened-via-association"
  - "Save/Save As with Cmd+S / Cmd+Shift+S keyboard shortcuts"
  - "Unsaved changes guard on navigation and window close"
  - "Editor routing from ToolContext (editorFilePath, openEditor)"
affects: [16-07]

# Tech tracking
tech-stack:
  added: []
  patterns: ["file-opened Tauri event from Rust to frontend", "useSaveActions hook for imperative save", "isDirtyRef pattern for event handler access to React state"]

key-files:
  created:
    - "src/components/pdf-editor/SaveController.tsx"
  modified:
    - "src-tauri/tauri.conf.json"
    - "src-tauri/src/main.rs"
    - "src-tauri/src/lib.rs"
    - "src/App.tsx"
    - "src/context/ToolContext.tsx"
    - "src/context/EditorContext.tsx"
    - "src/components/pdf-editor/EditorView.tsx"
    - "src/components/pdf-editor/EditorTopToolbar.tsx"

key-decisions:
  - "run_with_file(Option<String>) pattern: main.rs parses CLI args, passes to lib.rs which emits file-opened event with 500ms delay for webview mount"
  - "editorFilePath in ToolContext takes routing priority over activeTool and dashboard"
  - "CLEAR_DIRTY action added to EditorContext reducer for post-save state reset"
  - "useSaveActions hook exports save/saveAs for toolbar button; SaveController handles keyboard shortcuts separately"
  - "isDirtyRef pattern for beforeunload and onCloseRequested event handlers that need current React state"

patterns-established:
  - "File association pattern: Rust CLI arg -> emit event -> frontend listener -> route to editor"
  - "Save controller pattern: invisible component for shortcuts + useSaveActions hook for UI buttons"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 16 Plan 06: File Association, Save Model & Editor Routing Summary

**PDF file association with OS-level Open With, Cmd+S/Cmd+Shift+S save flow, unsaved changes guard, and editor/dashboard routing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T09:04:53Z
- **Completed:** 2026-03-17T09:10:06Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- PDF file association registered in tauri.conf.json so macOS can list Papercut in "Open With"
- CLI argument handling in main.rs + file-opened event emission to frontend
- Full save model: Cmd+S saves in-place (first save prompts), Cmd+Shift+S always opens Save As
- Unsaved changes guard on Dashboard navigation, browser close, and Tauri window close
- Editor routing integrated into ToolContext with editorFilePath taking priority

## Task Commits

Each task was committed atomically:

1. **Task 1: File association and launch-into-editor flow** - `76bf0bb` (feat)
2. **Task 2: Save controller, unsaved changes guard, and editor save flow** - `81d3dd0` (feat)

## Files Created/Modified
- `src-tauri/tauri.conf.json` - Added fileAssociations for PDF
- `src-tauri/src/main.rs` - CLI arg parsing for file path, delegates to run_with_file
- `src-tauri/src/lib.rs` - run_with_file emits file-opened event to frontend
- `src/context/ToolContext.tsx` - Added editorFilePath and openEditor
- `src/App.tsx` - Listens for file-opened event, routes to EditorView
- `src/context/EditorContext.tsx` - Added CLEAR_DIRTY action and clearDirty callback
- `src/components/pdf-editor/SaveController.tsx` - Keyboard shortcuts and save logic
- `src/components/pdf-editor/EditorView.tsx` - Mounts SaveController, unsaved changes guards
- `src/components/pdf-editor/EditorTopToolbar.tsx` - Save button with saved feedback

## Decisions Made
- run_with_file uses 500ms thread::sleep before emitting file-opened event to ensure webview has mounted
- ToolContext routing priority: editorFilePath > activeTool > dashboard
- SaveController is an invisible component for shortcuts; useSaveActions hook provides imperative save for toolbar button
- isDirtyRef pattern used for beforeunload and onCloseRequested handlers (event handlers need current state without re-registering)
- CLEAR_DIRTY reducer action added (was missing from original EditorContext)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added CLEAR_DIRTY action to EditorContext**
- **Found during:** Task 2 (Save controller)
- **Issue:** EditorContext had MARK_DIRTY but no way to clear dirty state after save
- **Fix:** Added CLEAR_DIRTY action to reducer and clearDirty callback to context value
- **Files modified:** src/context/EditorContext.tsx
- **Verification:** TypeScript compiles, clearDirty available in SaveController
- **Committed in:** 81d3dd0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for save flow correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- File association, save model, and editor routing complete
- Plan 07 can build on this foundation for any remaining editor features
- Manual testing recommended: right-click PDF > Open With > Papercut to verify file association

---
*Phase: 16-pdf-editor-gs-bundling*
*Completed: 2026-03-17*
