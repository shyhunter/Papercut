---
phase: 15-release-preparation
plan: 04
subsystem: infra
tags: [ci, cd, github-actions, linux, release-workflow]

# Dependency graph
requires:
  - phase: 15-release-preparation
    plan: 01
    provides: "GS sidecar removal from release workflow"
provides:
  - "CI validation workflow (TypeScript, Vitest, Cargo check, Clippy)"
  - "E2E test job on PRs with xvfb"
  - "4-platform release builds (macOS ARM, macOS Intel, Windows, Linux)"
affects: [ci-cd, distribution]

# Tech tracking
tech-stack:
  added: []
  patterns: ["GitHub Actions CI with validate + e2e jobs", "Conditional Linux deps via matrix platform check"]

key-files:
  created:
    - ".github/workflows/ci.yml"
  modified:
    - ".github/workflows/release.yml"

key-decisions:
  - "E2E tests only run on PRs (not every push) to save CI minutes"
  - "E2E job depends on validate job -- only runs if validation passes"
  - "Linux deps installed conditionally via matrix.platform check in release workflow"

patterns-established:
  - "CI pipeline: validate (fast) -> e2e (heavy, PR-only) job dependency chain"

requirements-completed: [CI-CD, DISTRIBUTION]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 15 Plan 04: CI/CD Workflows Summary

**Created CI validation workflow and added Linux target to release workflow for full 4-platform coverage**

## Performance

- **Duration:** 3 min
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments
- Created `.github/workflows/ci.yml` with two jobs:
  - **validate:** runs on every push/PR -- TypeScript check, Vitest tests, Cargo check, Clippy
  - **e2e:** runs on PRs only, after validate passes -- builds Tauri app, runs E2E tests with xvfb
- Added Linux (ubuntu-22.04 / x86_64-unknown-linux-gnu) to release build matrix
- Added conditional Linux system dependency installation step
- Updated release body to list Linux `.AppImage` / `.deb` downloads
- Verified no GS bundling steps remain in release workflow (removed by 15-01)

## Task Commits

1. **Task 1: Create CI validation workflow** - `d31906c`
2. **Task 2: Add Linux target to release workflow** - `eac4831`

## Files Created/Modified
- `.github/workflows/ci.yml` - New CI workflow with validate and e2e jobs
- `.github/workflows/release.yml` - Added Linux matrix entry, Linux deps step, Linux in release body

## Deviations from Plan
None.

## Issues Encountered
None.

## Verification
- ci.yml has validate + e2e jobs
- release.yml has 4 platform entries in matrix (macOS ARM, macOS Intel, Windows, Linux)
- Linux dependencies installed in both workflows
- E2E tests use xvfb-run on Linux
- No GS bundling in release workflow

---
*Phase: 15-release-preparation*
*Completed: 2026-03-16*
