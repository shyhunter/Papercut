# Phase 7: E2E Test Automation - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate the critical user flows (open → configure → compare → save) for both PDF and image processing so regressions are detectable without running the app by hand. Covers all option combinations (quality levels, resize, format conversion, custom dimensions) plus error paths. CI configuration is out of scope for now — tests run locally.

</domain>

<decisions>
## Implementation Decisions

### Test framework & runner
- Framework choice: Claude's discretion — pick whatever integrates most cleanly with existing Vitest setup (Playwright + tauri-driver is the roadmap suggestion)
- Test location: Alongside unit tests in `src/` (not a separate top-level `e2e/` dir)
- Run command: Separate `npm run test:e2e` — keeps unit test loop fast
- App target: Built app (`tauri build`) — tests run against the real production binary, not dev server

### Flow coverage scope
- **PDF matrix** — every option combination gets its own test:
  - web-only (compression, no resize)
  - web + resize (preset page size)
  - web + resize + custom width×height input
  - All 4 quality levels (screen / ebook / printer / prepress)
- **Image matrix** — same matrix approach:
  - quality slider only
  - quality + format conversion (JPG/PNG/WebP)
  - quality + format + resize (aspect ratio lock)
  - quality + format + resize + custom dimensions input
- **Error paths** also covered:
  - Oversized file (>100 MB) → blocking modal appears
  - Corrupt/zero-byte file → inline error shown
  - Cancel mid-processing → UI returns to Configure step
- **Output verification:** File saved to disk + format/type verified (output exists, is the right format, is smaller than input for compression flows). Not byte-level content inspection.

### Test fixtures & file handling
- **Input fixtures:** New dedicated E2E fixtures (not reusing existing `test-fixtures/`). Purpose-built for E2E scenarios (e.g. photo-heavy PDF, large PNG, corrupt file stub).
- **Output location:** Claude's discretion — use whatever is cleanest for assertions and CI cleanup (temp dir or dedicated `e2e-output/` in .gitignore)
- **Oversized-file test:** Use an actual large file (sparse/generated via script) — not mocked
- **Save dialog:** Mock/intercept the Tauri `dialog.save()` call — tests provide a fixed output path without OS dialog interaction

### CI & headless execution
- **Platform:** Local only for now — no GitHub Actions workflow file in this phase
- **Cross-platform support:** Tests should work on both macOS (no virtual display) and Linux (Xvfb), for future CI on Ubuntu runners
- **Window visibility:** Visible window during tests (not forced headless) — useful for local debugging
- **Failure reporting:** Screenshots + video recording on test failure

### Claude's Discretion
- Exact Playwright/tauri-driver setup and configuration
- Output file destination (temp dir vs e2e-output/)
- E2E fixture generation scripts (dd, Node.js, or Rust)
- How to wire mock for `dialog.save()` in the chosen framework
- Test file naming convention

</decisions>

<specifics>
## Specific Ideas

- Coverage goal: "Every possible user flow" — matrix of option combinations, not just a single happy path per file type
- Error paths are first-class, not afterthoughts — each error scenario gets its own test
- Saves must be verified: output file exists, correct format, smaller than input (for compression flows)
- Cross-platform headless support built in from the start (Xvfb path for Linux), even though CI config ships later

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-e2e-test-automation-high*
*Context gathered: 2026-02-25*
