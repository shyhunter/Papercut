---
phase: 15-release-preparation
plan: 01
subsystem: infra
tags: [ghostscript, tauri, sidecar, system-binary, release-workflow]

# Dependency graph
requires:
  - phase: 05-pdf-real-compression-critical
    provides: "GS sidecar integration for compress_pdf"
  - phase: 14-security-privacy-hardening
    provides: "detect_converters system"
provides:
  - "System GS resolution via find_ghostscript() helper"
  - "GS detection in detect_converters command"
  - "Release workflow without bundled GS"
affects: [release-preparation, build-packaging]

# Tech tracking
tech-stack:
  added: []
  patterns: ["System binary resolution via which/where for external tools"]

key-files:
  created: []
  modified:
    - "src-tauri/src/lib.rs"
    - "src-tauri/tauri.conf.json"
    - ".github/workflows/release.yml"

key-decisions:
  - "System GS via PATH lookup instead of sidecar bundling -- follows user decision to not bundle external dependencies"
  - "find_ghostscript() checks which/where, plus Homebrew paths on macOS as fallback"
  - "GS detection added to detect_converters for frontend awareness"

patterns-established:
  - "System binary resolution: use which/where to find system tools, with platform-specific fallback paths"

requirements-completed: [BUILD-PACKAGING]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 15 Plan 01: Remove GS Sidecar Summary

**Refactored all 5 Ghostscript invocations from Tauri sidecar to system-installed binary via PATH resolution with cross-platform support**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T08:16:19Z
- **Completed:** 2026-03-16T08:19:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `find_ghostscript()` helper with cross-platform PATH resolution (macOS/Linux/Windows)
- Replaced all 5 `.sidecar("gs")` calls with `.command(&gs_bin)` using system-installed GS
- Added GS detection to `detect_converters` for frontend visibility
- Removed `externalBin` GS entry from `tauri.conf.json`
- Removed all 3 Ghostscript download/copy steps from release workflow
- Updated release notes with optional dependency install instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor Rust GS invocations from sidecar to system binary** - `d8821b5` + `50d548c` (feat + fix)
2. **Task 2: Remove GS bundling from release workflow** - `d34d34b` (feat)

## Files Created/Modified
- `src-tauri/src/lib.rs` - Added find_ghostscript() helper; replaced 5 sidecar calls with system binary command; added GS to detect_converters
- `src-tauri/tauri.conf.json` - Removed externalBin GS entry
- `.github/workflows/release.yml` - Removed GS download steps; removed gs_binary from matrix; updated release body with optional dependency instructions

## Decisions Made
- Used `app.shell().command(&gs_bin)` instead of `std::process::Command` to maintain compatibility with Tauri shell plugin's spawn + event loop pattern and existing cancellation via ProcessState
- find_ghostscript() returns a binary name/path suitable for Tauri shell command, not PathBuf
- Added Homebrew fallback paths on macOS (`/opt/homebrew/bin/gs`, `/usr/local/bin/gs`) in case `which` fails but GS is installed
- Clear user-facing error messages explaining how to install GS per platform

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Linter re-added externalBin to tauri.conf.json**
- **Found during:** Task 1 commit
- **Issue:** A linter/formatter hook re-added the externalBin entry after initial removal
- **Fix:** Committed removal again in a separate fix commit
- **Files modified:** src-tauri/tauri.conf.json
- **Committed in:** 50d548c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor -- linter interference required a second commit for the same change.

## Issues Encountered
None beyond the linter re-add noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All GS invocations use system binary -- ready for release builds without bundled GS
- Release workflow cleaned and simplified
- detect_converters now reports GS availability to frontend

---
*Phase: 15-release-preparation*
*Completed: 2026-03-16*
