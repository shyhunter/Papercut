---
phase: 14-security-privacy-hardening
plan: 01
subsystem: security
tags: [input-validation, injection-prevention, tauri, rust, allow-list]

requires:
  - phase: 13
    provides: shell command invocation for LibreOffice, Calibre, textutil, Word converters
provides:
  - validate_source_path() centralized Rust path validation
  - validate_filename_chars() Unicode-aware filename allow-list
  - validate_calibre_extra_args() CLI flag allow-list
  - isFilenameSafe() frontend validation mirror
affects: [14-02, 14-03, 14-04]

tech-stack:
  added: [uuid]
  patterns: [allow-list input validation, frontend-backend validation mirroring]

key-files:
  created: []
  modified:
    - src-tauri/src/lib.rs
    - src-tauri/Cargo.toml
    - src/lib/fileValidation.ts

key-decisions:
  - "Allow-list character set: alphanumeric (Unicode-aware) plus space, dot, hyphen, underscore, parens, brackets, braces, plus, equals, hash, at, bang, comma"
  - "Path traversal blocked via component iteration (ParentDir check), not string matching"
  - "Frontend regex includes Unicode ranges for accented Latin, Cyrillic, CJK, and Japanese to match Rust is_alphanumeric()"

patterns-established:
  - "validate_source_path() as first line in every Tauri IPC command accepting a file path"
  - "Frontend-backend validation mirroring: same allow-list in both TypeScript and Rust"

requirements-completed: [UX-03]

duration: 3min
completed: 2026-03-15
---

# Phase 14 Plan 01: Input Validation & Injection Prevention Summary

**Centralized path/filename validation in Rust (allow-list) and mirrored frontend isFilenameSafe() closing all shell injection vectors in Tauri IPC commands**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T12:02:49Z
- **Completed:** 2026-03-15T12:05:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Every Tauri IPC command that accepts a file path now validates it before any processing via validate_source_path()
- Calibre extra_args validated against a known-safe flag allow-list preventing arbitrary CLI injection
- Frontend isFilenameSafe() mirrors the Rust allow-list so users see rejection before the IPC call
- Shell-dangerous characters (backticks, semicolons, dollar signs, quotes, pipes) are rejected with clear user-facing error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Rust-side path validation and filename allow-list** - `91f1e0f` (feat)
2. **Task 2: Frontend filename validation mirror** - `4ebf214` (feat)

## Files Created/Modified

- `src-tauri/src/lib.rs` - Added validate_source_path(), validate_filename_chars(), validate_calibre_extra_args(), and wired validation into all 12 IPC commands
- `src-tauri/Cargo.toml` - Added uuid dependency
- `src/lib/fileValidation.ts` - Added isFilenameSafe() and UNSAFE_FILENAME_MESSAGE

## Decisions Made

- Allow-list character set chosen to support international filenames (Unicode alphanumeric) while blocking all shell metacharacters
- Path traversal detected via std::path::Component::ParentDir iteration rather than string matching to handle all OS path formats correctly
- uuid dependency added now (needed by Plan C temp file naming) to avoid a second Cargo.toml edit later

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All IPC commands now validate inputs, ready for Plan 02 (temp file hardening) and Plan 03 (CSP/capability lockdown)
- Frontend validation function available for UI integration in file picker flows

---
*Phase: 14-security-privacy-hardening*
*Completed: 2026-03-15*

## Self-Check: PASSED
