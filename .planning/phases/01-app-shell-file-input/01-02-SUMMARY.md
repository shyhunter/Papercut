---
phase: 01-app-shell-file-input
plan: 02
subsystem: ui
tags: [tauri, react, typescript, hooks, drag-drop, file-picker, sonner, lucide]

# Dependency graph
requires:
  - phase: 01-app-shell-file-input
    plan: 01
    provides: "Shared types (FileEntry, DragState, AppStep), fileValidation utilities, dialog:allow-open capability, dragDropEnabled window config, shadcn Card/Button/Sonner components"
provides:
  - useFileDrop hook: Tauri onDragDropEvent listener with DragState machine (idle/over-valid/over-invalid)
  - useFileOpen hook: plugin-dialog open() wrapper with PDF/image file filters
  - LandingCard component: centered card with equal-prominence halves, drag animation, loading bar
  - App.tsx: root component owning fileEntry, currentStep, isLoading state with full file input wiring
  - Toast errors via Sonner for unsupported file types
affects: [01-03, 02-pdf-processing, 03-image-processing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useRef pattern for stable Tauri event listener callbacks (avoids re-registering on every render)
    - Empty deps[] on event listener useEffect + ref for fresh callback
    - Empty string signal from useFileDrop to App.tsx for invalid drop (avoids separate callback)
    - 600ms loading state after valid file selection before advancing step (locked UX decision)

key-files:
  created:
    - src/hooks/useFileDrop.ts
    - src/hooks/useFileOpen.ts
    - src/components/LandingCard.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "useFileDrop uses ref pattern to keep callback stable — prevents event listener re-registration on every render"
  - "Invalid drop signaled via empty string (onFileDrop('')) rather than separate onInvalidDrop callback — simpler API"
  - "dragState 'enter' payload may have empty paths[] on some OS/Tauri versions — falls back to over-invalid for visual feedback; corrected on 'over' event"
  - "600ms loading state is a locked UX decision — acknowledges the drop and provides visual continuity"
  - "button type='button' explicitly set on Back to pick control — avoids implicit form submit behavior"

patterns-established:
  - "Pattern: Tauri event listeners use useRef for callback + empty deps[] to register once and keep callback fresh"
  - "Pattern: App.tsx is the state container (fileEntry, currentStep, isLoading); child components are pure UI"
  - "Pattern: Invalid file signaled via empty string sentinel, not separate callback, for simpler hook API"

requirements-completed: [FINP-01, FINP-02]

# Metrics
duration: 10min
completed: 2026-02-19
---

# Phase 1 Plan 02: File Input Summary

**Tauri drag-and-drop and native file picker wired into an animated LandingCard — file path, format, and name captured in App.tsx state on valid selection**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-19T17:18:46Z
- **Completed:** 2026-02-19T17:28:00Z
- **Tasks:** 3 (Tasks 1–2 auto, Task 3 checkpoint:human-verify — approved)
- **Files modified:** 4 (2 created hooks, 1 created component, 1 modified App.tsx)

## Accomplishments

- useFileDrop.ts: Tauri onDragDropEvent listener with full DragState machine; ref pattern ensures stable listener
- useFileOpen.ts: @tauri-apps/plugin-dialog open() wrapper filtered to PDF/JPG/PNG/WebP
- LandingCard.tsx: centered card, equal-prominence halves, drag glow/scale animation, loading bar on valid drop
- App.tsx: full file state wiring — fileEntry, currentStep, isLoading; toast errors for unsupported files via Sonner

## Task Commits

Each task was committed atomically:

1. **Task 1: File input hooks (picker + drag-drop) and validation wiring** - `2c5a7a4` (feat)
2. **Task 2: LandingCard component and App.tsx wiring** - `427c684` (feat)

3. **Task 3: Human verify — file input (picker + drag-and-drop)** - checkpoint:human-verify, approved by user

## Files Created/Modified

- `src/hooks/useFileDrop.ts` - Tauri onDragDropEvent listener; returns DragState; uses ref to avoid listener churn
- `src/hooks/useFileOpen.ts` - plugin-dialog open() wrapped as async function returning path string or null
- `src/components/LandingCard.tsx` - 131-line component; two equal halves, drag animation, loading bar, tagline
- `src/App.tsx` - Root component wiring file state, drag state, picker, 600ms loading state, Sonner toasts

## Decisions Made

- **useRef for onFileDrop callback:** Keeps the Tauri event listener stable (registered once, deps = []). Without ref, the listener would re-register on every render that changes handleFileSelected reference.
- **Empty string sentinel for invalid drop:** useFileDrop calls onFileDrop('') for invalid drops rather than requiring a separate onInvalidDrop prop. Simpler hook interface; App.tsx distinguishes by checking `!filePath`.
- **dragState 'enter' edge case:** Tauri's enter event may not include paths[] on some OS/Tauri versions. Hook falls back to 'over-invalid' on enter if paths are empty; corrects to proper state on the next 'over' event.
- **button type="button":** Added explicitly on the "Back to pick" control to prevent implicit form submit behavior (IDE hint).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added explicit type="button" on inline button**
- **Found during:** Task 2 (App.tsx wiring)
- **Issue:** IDE diagnostic flagged missing `type` attribute on the "Back to pick" button — implicit type defaults to "submit" in some contexts
- **Fix:** Added `type="button"` explicitly
- **Files modified:** src/App.tsx
- **Verification:** TypeScript check passes; no IDE diagnostics remain
- **Committed in:** `427c684` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed over-state update logic in useFileDrop**
- **Found during:** Task 1 (useFileDrop review)
- **Issue:** Plan code only updated dragState on 'over' if current state was 'over-invalid' — this would miss correcting 'over-valid' to 'over-invalid' when cursor moves to a different file mid-drag
- **Fix:** Removed the `dragState === 'over-invalid'` guard on the 'over' handler; now always recalculates from paths when paths are available
- **Files modified:** src/hooks/useFileDrop.ts
- **Verification:** TypeScript check passes; logic handles all mid-drag transitions correctly
- **Committed in:** `2c5a7a4` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes are correctness improvements. No scope creep. The over-state fix ensures drag feedback stays accurate when the user drags mixed-type files across the window.

## Issues Encountered

None beyond the two auto-fixed items above.

## User Setup Required

None - no external service configuration required. App runs locally via `npm run tauri dev`.

## Next Phase Readiness

- useFileDrop and useFileOpen ready for plan 01-03 (StepBar) to consume dragState
- fileEntry (path, format, name) stored in App.tsx state — ready for Phase 2 (PDF/image processing)
- currentStep advances to 1 on valid file selection — plan 01-03 StepBar can read this value
- Sonner toast infrastructure in place for all future error feedback

## Self-Check: PASSED

- 01-02-SUMMARY.md: FOUND
- STATE.md: FOUND
- ROADMAP.md: FOUND
- Commit 2c5a7a4 (Task 1): FOUND
- Commit 427c684 (Task 2): FOUND

---
*Phase: 01-app-shell-file-input*
*Completed: 2026-02-19*
