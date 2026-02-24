---
phase: 06-safety-hardening-high
plan: 1
subsystem: ui
tags: [tauri, react, typescript, file-validation, error-handling, tdd]

# Dependency graph
requires:
  - phase: 04-polish-trust
    provides: LandingCard inline error pattern (invalidDropError) and App.tsx file loading flow
  - phase: 01-app-shell-file-input
    provides: useFileDrop, openFilePicker, handleFileSelected pattern
provides:
  - FILE_SIZE_LIMIT_BYTES constant (104857600) and getFileSizeBytes helper in fileValidation.ts
  - Blocking file-size-limit modal in LandingCard for >100 MB files
  - Inline empty-file error for zero-byte files
  - Inline corrupt-file error (replaces toast for load-time failures)
  - FI-09 and FI-10 integration tests
affects: [07-e2e-coverage, any future phase that modifies handleFileSelected or LandingCard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getFileSizeBytes uses readFile (existing capability) — no extra Tauri permissions"
    - "handleFileSelected is now async — size check runs before setIsLoading"
    - "Single inline error slot in LandingCard: emptyFileError ?? corruptFileError ?? invalidDropError"
    - "File size limit modal: fixed overlay (no shadcn Dialog) — shadcn Dialog not installed"

key-files:
  created: []
  modified:
    - src/lib/fileValidation.ts
    - src/components/LandingCard.tsx
    - src/App.tsx
    - src/lib/__tests__/fileValidation.test.ts
    - src/integration/__tests__/01-file-input.test.tsx
    - src/test/setup.ts
    - src/integration/__tests__/02-pdf-configure.test.tsx

key-decisions:
  - "getFileSizeBytes uses readFile (not Tauri stat API) — readFile already permitted, stat would require new capability"
  - "Modal is a plain Tailwind fixed overlay (not shadcn Dialog) — Dialog component not installed in this project"
  - "handleFileSelected made async to await getFileSizeBytes before advancing to Configure"
  - "Global readFile mock in setup.ts defaults to 1 MB Uint8Array so getFileSizeBytes works in all integration tests without per-test mocking"
  - "Corrupt-file useEffects now set corruptFileError inline state instead of toast — load-time failures are inline, mid-flow failures keep toast"

patterns-established:
  - "Inline error slot consolidation: single <p> with priority: emptyFileError ?? corruptFileError ?? invalidDropError"
  - "Per-test getFileSizeBytes override via vi.mocked(fileValidation.getFileSizeBytes).mockResolvedValueOnce()"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-02-24
---

# Phase 06 Plan 01: File Size Guard + Precise File Error Messages Summary

**100 MB hard cap via blocking modal and precise inline errors replacing generic toast for zero-byte and corrupt files at load time**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-24T16:01:41Z
- **Completed:** 2026-02-24T16:11:00Z
- **Tasks:** 1 (TDD: RED + GREEN + verify)
- **Files modified:** 7

## Accomplishments
- FILE_SIZE_LIMIT_BYTES (104857600) and getFileSizeBytes exported from fileValidation.ts
- Blocking modal for >100 MB files — Cancel-only, no "proceed anyway" option
- Inline "This file is empty" error for zero-byte files (auto-clears 2500ms)
- Inline "This file appears to be corrupt" error for load-time failures (replaces toast)
- FI-09 and FI-10 integration tests pass; all 255 tests green, zero regressions

## Task Commits

Each task was committed atomically:

1. **RED — failing tests** - `196aeaa` (test)
2. **GREEN — implementation** - `7958269` (feat)

_TDD task: RED commit then GREEN commit._

## Files Created/Modified
- `src/lib/fileValidation.ts` - Added FILE_SIZE_LIMIT_BYTES constant and getFileSizeBytes async helper
- `src/components/LandingCard.tsx` - New props (fileSizeLimitBytes, emptyFileError, corruptFileError, onFileSizeLimitDismiss); consolidated inline error slot; blocking file-size modal overlay
- `src/App.tsx` - handleFileSelected made async; size check before advancing; corruptFileError state replacing toast in corrupt-file useEffects
- `src/lib/__tests__/fileValidation.test.ts` - Tests for FILE_SIZE_LIMIT_BYTES and getFileSizeBytes (4 new tests)
- `src/integration/__tests__/01-file-input.test.tsx` - FI-09 (>100 MB modal), FI-10 (zero-byte inline error); fileValidation module mock
- `src/test/setup.ts` - Global readFile mock defaults to 1 MB Uint8Array so getFileSizeBytes works in all integration tests
- `src/integration/__tests__/02-pdf-configure.test.tsx` - PC-05 updated to supply two mockResolvedValueOnce (one for getFileSizeBytes, one for getPdfMeta)

## Decisions Made
- getFileSizeBytes uses readFile (not Tauri stat API) — readFile already permitted, stat would require a new capability declaration
- Modal is a plain Tailwind fixed overlay — shadcn Dialog is not installed in this project
- handleFileSelected made async to enable await on getFileSizeBytes before the 600ms setTimeout advance
- Global readFile mock updated to return 1 MB bytes by default, preventing getFileSizeBytes from throwing in all existing integration tests without per-test changes
- Load-time failures (zero-byte, >100MB, readFile error) show inline errors; mid-flow processing failures keep toasts — clean separation of concerns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated global readFile mock to prevent test regressions**
- **Found during:** GREEN phase (verification run)
- **Issue:** The existing global readFile mock returned `undefined` by default; the new getFileSizeBytes call consumed mock values intended for getPdfMeta, breaking PC-05 and all other integration tests that navigate to Configure
- **Fix:** Changed global mock default to `new Uint8Array(1024 * 1024)`; updated PC-05 to provide two `mockResolvedValueOnce` calls (one per readFile call in the navigation sequence)
- **Files modified:** `src/test/setup.ts`, `src/integration/__tests__/02-pdf-configure.test.tsx`
- **Verification:** All 255 tests pass
- **Committed in:** `7958269` (GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - regression from changed call order)
**Impact on plan:** Necessary to maintain test integrity. No scope creep — test infrastructure fix only.

## Issues Encountered
- The fileValidation module mock in 01-file-input.test.tsx needed to be a full `vi.mock` with `importOriginal` to preserve other exports (detectFormat, getFileName etc.) while mocking getFileSizeBytes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- File input safety hardening complete: large files blocked before processing, zero-byte files caught early, corrupt files show precise inline errors
- Ready for Phase 06 Plan 02 and 03 (remaining safety hardening tasks)

## Self-Check: PASSED

All expected files exist. All task commits confirmed in git log.

---
*Phase: 06-safety-hardening-high*
*Completed: 2026-02-24*
