---
phase: 14-security-privacy-hardening
plan: 02
subsystem: security
tags: [csp, tauri, webview, xss, dependency-audit, npm-audit, cargo-audit]

# Dependency graph
requires:
  - phase: 04-polish-trust
    provides: privacy tests validating no network permissions
provides:
  - Strict CSP blocking inline scripts and external connections
  - Dependency audit baseline with documented accepted risks
affects: [14-security-privacy-hardening]

# Tech tracking
tech-stack:
  added: [cargo-audit]
  patterns: [CSP-based webview hardening]

key-files:
  created: []
  modified:
    - src-tauri/tauri.conf.json
    - package-lock.json
    - src-tauri/Cargo.lock

key-decisions:
  - "CSP style-src includes unsafe-inline for Tailwind v4 and React inline styles compatibility"
  - "Remaining npm high vulns are in @wdio/* dev deps only -- not shipped in production Tauri bundle"
  - "Cargo audit warnings are unmaintained gtk-rs GTK3 bindings (Tauri transitive deps) -- not security vulnerabilities"
  - "shell:allow-open retained unscoped for reveal-in-Finder; CSP connect-src prevents webview network access"

patterns-established:
  - "CSP pattern: script-src 'self' with no unsafe-inline/unsafe-eval; style-src allows unsafe-inline"
  - "Audit baseline: npm audit fix for non-breaking fixes; document dev-only accepted risks"

requirements-completed: [UX-03]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 14 Plan 02: CSP & Dependency Audit Summary

**Strict CSP blocking inline scripts and external connections, plus npm/Cargo dependency audits reducing vulnerabilities from 21 to 16 (remaining are dev-only @wdio deps)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T12:02:35Z
- **Completed:** 2026-03-15T12:06:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Configured strict CSP in tauri.conf.json: script-src 'self' (no unsafe-inline/unsafe-eval), connect-src limited to IPC only, object-src 'none'
- Ran npm audit fix resolving 5 vulnerability groups (hono, rollup, minimatch, express-rate-limit, @hono/node-server)
- Installed and ran cargo-audit: zero vulnerabilities found (19 unmaintained-crate warnings only)
- Verified existing privacy tests still pass with new CSP configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure strict CSP and review capability scopes** - `0b76ef8` (feat)
2. **Task 2: Dependency audit -- npm and Cargo** - `5fc80d0` (chore)

## Files Created/Modified
- `src-tauri/tauri.conf.json` - Strict CSP replacing null (open) policy
- `package-lock.json` - Updated dependencies from npm audit fix
- `src-tauri/Cargo.lock` - Updated from cargo audit index fetch

## Decisions Made
- CSP style-src includes 'unsafe-inline' because Tailwind v4 injects styles at runtime and React uses inline style attributes; blocking these would break the entire UI
- shell:allow-open kept unscoped -- it enables reveal-in-Finder and the CSP connect-src restriction prevents the webview from making network calls regardless
- Remaining 4 high npm vulnerabilities are all in @wdio/mocha-framework dependency chain (serialize-javascript, undici) -- these are E2E test dev dependencies not bundled in production; fix requires breaking downgrade to @wdio/mocha-framework@6.x
- Cargo audit shows only "unmaintained" warnings for gtk-rs GTK3 bindings -- these are Tauri's transitive dependencies for Linux support, not actual security issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSP hardening complete; webview is locked down against XSS and data exfiltration
- Dependency audit baseline established; remaining vuln cleanup tracked as accepted dev-only risk
- Ready for Plan 03 (secure IPC validation) and Plan 04 (privacy verification)

---
*Phase: 14-security-privacy-hardening*
*Completed: 2026-03-15*
