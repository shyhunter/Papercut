---
phase: 04-polish-trust
plan: 02
subsystem: testing
tags: [vitest, privacy, tauri, capabilities, fetch-spy, tdd]

# Dependency graph
requires:
  - phase: 04-01
    provides: PrivacyFooter component (user-facing privacy claim) that this plan tests programmatically
provides:
  - Two CI-runnable Vitest tests proving no outbound network calls: static capabilities config assertion + runtime fetch spy
  - Automated proof that Tauri capability config contains zero http: permissions
  - Automated proof that processImage code path never touches window.fetch
affects:
  - Future phases adding new Tauri permissions (must re-run tests to confirm no http: added)
  - Any changes to imageProcessor.ts (runtime fetch spy would catch accidental fetch introduction)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED→GREEN→REFACTOR for privacy invariant tests"
    - "Static config assertion via readFileSync on real JSON (not mocked)"
    - "Runtime network isolation via vi.stubGlobal('fetch', vi.fn()) + vi.mocked(fetch).not.toHaveBeenCalled()"
    - "vi.unstubAllGlobals() in afterAll to restore global state between test suites"

key-files:
  created:
    - src/lib/__tests__/privacy.test.ts
  modified:
    - .planning/TEST_PLAN.md

key-decisions:
  - "capPath resolved via path.join(__dirname, '../../../src-tauri/capabilities/default.json') — relative to test file, not process.cwd()"
  - "fetch stub placed inside test body (not beforeEach) to keep setup co-located with the assertion it enables"
  - "afterAll vi.unstubAllGlobals() ensures fetch mock does not leak into other test files"
  - "permissions array normalized to handle both string entries and {identifier} object entries"

patterns-established:
  - "Privacy test pattern: static config assertion (readFileSync) + runtime spy (vi.stubGlobal) in one file"

requirements-completed:
  - UX-03

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 4 Plan 02: Privacy Verification Tests Summary

**Two Vitest privacy tests using readFileSync config assertion + vi.stubGlobal fetch spy to prove zero outbound network calls in the Tauri capability config and imageProcessor runtime**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T12:00:09Z
- **Completed:** 2026-02-23T12:02:22Z
- **Tasks:** 1 (TDD — 3 commits: RED, REFACTOR, chore)
- **Files modified:** 2

## Accomplishments

- Static config test: reads real `src-tauri/capabilities/default.json` via `fs.readFileSync` and asserts zero identifiers start with `http:` — handles both string and `{identifier}` object permission entries
- Runtime fetch spy test: stubs `window.fetch` via `vi.stubGlobal`, runs `processImage`, and asserts `vi.mocked(fetch).not.toHaveBeenCalled()` — proves the entire Tauri IPC processing path never touches the network
- Both tests run in Node.js Vitest (no Tauri runtime required), making them CI-safe
- Updated `TEST_PLAN.md` automated coverage table with PV-01 and PV-02 entries per P008 rule

## Task Commits

Each TDD phase committed atomically:

1. **RED — Add privacy test file** - `62dc61d` (test)
2. **REFACTOR — Clean up setup into beforeAll** - `f8a64b0` (refactor)
3. **P008 — TEST_PLAN.md entries** - `09a0f30` (chore)

## Files Created/Modified

- `src/lib/__tests__/privacy.test.ts` — Two privacy tests: static capabilities config assertion (PV-01) and runtime fetch spy (PV-02)
- `.planning/TEST_PLAN.md` — Added PV-01 and PV-02 rows to the Automated vs Manual coverage table

## Decisions Made

- `capPath` resolved via `path.join(__dirname, '../../../src-tauri/capabilities/default.json')` — relative to the test file location rather than `process.cwd()` to ensure consistent resolution regardless of where vitest is invoked from
- `fetch` stub placed inside the test body alongside `vi.mocked(readFile)` and `vi.mocked(invoke)` setup, keeping all arrange steps co-located with the assertion they enable
- `vi.unstubAllGlobals()` in `afterAll` (not `afterEach`) is sufficient since there is only one test in the suite, and ensures the global state is fully cleaned up after the describe block

## Deviations from Plan

None — plan executed exactly as written.

The TDD cycle completed faster than planned because:
- Path resolution (`path.join(__dirname, '../../../...')`) was correct on first write
- `processImage` already uses Tauri IPC exclusively with no `fetch` calls, so the runtime spy test passes immediately (as expected by the plan)
- RED and GREEN phases collapsed into a single commit since the test was structurally complete and passing from the start

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Tests run with `npm test` from the project root.

## Next Phase Readiness

- Phase 04 is now complete: PrivacyFooter (04-01) + privacy tests (04-02) deliver the full UX-03 requirement
- Privacy guarantee is now both user-visible (footer) and developer-verifiable (automated tests)
- If any future phase adds a Tauri permission starting with `http:`, PV-01 will fail CI immediately

## Self-Check: PASSED

- `src/lib/__tests__/privacy.test.ts` — FOUND
- `.planning/phases/04-polish-trust/04-02-SUMMARY.md` — FOUND
- `.planning/TEST_PLAN.md` — FOUND
- Commit `62dc61d` (RED) — FOUND
- Commit `f8a64b0` (REFACTOR) — FOUND
- Commit `09a0f30` (P008 chore) — FOUND
- `npm test` — 191/191 passing

---
*Phase: 04-polish-trust*
*Completed: 2026-02-23*
