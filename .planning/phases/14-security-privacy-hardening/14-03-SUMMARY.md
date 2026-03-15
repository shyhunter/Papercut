---
phase: 14-security-privacy-hardening
plan: 03
subsystem: security
tags: [uuid, temp-files, password-redaction, ghostscript, libreoffice]

# Dependency graph
requires:
  - phase: 14-01
    provides: uuid crate in Cargo.toml, validate_source_path, validate_filename_chars
provides:
  - UUID-based temp file naming across all Tauri commands (10 locations)
  - sweep_papercut_temp_files() startup cleanup for orphaned temp files
  - LO profile directory cleanup after LibreOffice conversion
  - redact_gs_passwords() password scrubbing for Ghostscript error messages
  - Generic user-facing error messages for protect_pdf and unlock_pdf
affects: []

# Tech tracking
tech-stack:
  added: [uuid v4]
  patterns: [UUID temp naming, startup sweep, password redaction]

key-files:
  created: []
  modified:
    - src-tauri/src/lib.rs

key-decisions:
  - "Generic user-facing error messages for protect_pdf/unlock_pdf instead of raw stderr -- prevents any password leakage"
  - "UUID-only naming for calibre/textutil/word temp files -- avoids leaking source filename into temp paths"
  - "while-loop in redact_gs_passwords to handle multiple occurrences of same flag"
  - "LO profile cleanup on both success and error paths in convert_with_libreoffice"

patterns-established:
  - "UUID temp naming: all papercut_* temp files use Uuid::new_v4() for collision-proof, unpredictable names"
  - "Startup sweep: sweep_papercut_temp_files() in Tauri setup() hook cleans orphans older than 1 hour"
  - "Password redaction: never return raw GS stderr to frontend; use generic messages or redact_gs_passwords()"

requirements-completed: [UX-03]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 14 Plan 03: Temp File Hardening & Password Redaction Summary

**UUID-based temp file naming across 10 commands, startup orphan sweep, LO profile cleanup, and Ghostscript password redaction**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T12:08:59Z
- **Completed:** 2026-03-15T12:12:40Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced all 10 subsec_nanos-based temp file names with UUID v4 -- eliminates collision risk and symlink attack potential
- Added sweep_papercut_temp_files() called during Tauri setup() to clean orphaned papercut_* files older than 1 hour
- Added LO profile directory cleanup on all exit paths in convert_with_libreoffice
- Added redact_gs_passwords() and replaced raw stderr in protect_pdf/unlock_pdf with generic user-facing messages

## Task Commits

Each task was committed atomically:

1. **Task 1: UUID temp file naming and startup sweep** - `6802322` (feat)
2. **Task 2: Password redaction in Ghostscript error messages** - `e498011` (feat)

## Files Created/Modified
- `src-tauri/src/lib.rs` - UUID temp naming (10 locations), sweep function, LO profile cleanup, password redaction helper, generic error messages

## Decisions Made
- Used generic user-facing error messages for protect_pdf ("PDF password protection failed...") and unlock_pdf ("PDF unlock failed...") instead of forwarding raw stderr -- eliminates any possibility of password leakage
- UUID-only naming for calibre/textutil/word temp files removes source filename from temp paths, preventing information leakage
- Used while-loop in redact_gs_passwords instead of if-let to handle multiple occurrences of the same password flag in a single stderr string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All temp file lifecycle and password redaction hardening complete
- Ready for Plan 04 (remaining security hardening tasks)

---
*Phase: 14-security-privacy-hardening*
*Completed: 2026-03-15*
