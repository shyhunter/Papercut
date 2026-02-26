---
plan: 07-02
status: complete
completed: 2026-02-26
---

# 07-02 Summary — PDF E2E Test Suite

## What Was Built

**Task 1** (prior commit 86b5d46): Added `data-testid` attributes to all PDF-flow components:
- `StepBar.tsx` — `step-bar-item`, `data-step-index`, `data-active`
- `LandingCard.tsx` — `open-file-btn`, `drop-zone`, `invalid-drop-error`
- `App.tsx` — `file-size-limit-modal`, `file-size-limit-dismiss`, `empty-file-error`, `corrupt-file-error`, `loading-spinner`
- `ConfigureStep.tsx` — `configure-step`, `quality-select`, `quality-option-{web/screen/print/archive}`, `resize-toggle`, `page-preset-select`, `custom-width-input`, `custom-height-input`, `generate-preview-btn`, `cancel-btn`, `back-btn`
- `CompareStep.tsx` — `compare-step`, `stats-bar`, `save-btn`, `back-btn`, `target-not-met-banner`

**Task 2** (commit 2fd9663): Created `src/e2e/tests/pdf-flows.test.ts` — 11 tests across 4 suites:
- **Quality matrix** (4 tests): `PDF-Q-WEB`, `PDF-Q-SCREEN`, `PDF-Q-PRINT`, `PDF-Q-ARCHIVE` — uses `quality-option-*` radio click pattern (correct for fieldset/radio implementation)
- **Resize** (3 tests): `PDF-R-PRESET` (A3 preset), `PDF-R-CUSTOM` (100×150 mm), `PDF-R-QUALITY-RESIZE` (combined web+A3)
- **Error paths** (3 tests): `PDF-ERR-OVERSIZE` (modal), `PDF-ERR-CORRUPT` (inline error), `PDF-ERR-CANCEL` (recovery)
- **Save filter** (1 test): `PDF-SAVE-FILTER` — intercepts `dialog.save`, confirms PDF filter present and no image filters

Also fixed: `vitest.config.ts` excludes `src/e2e/**` so Vitest doesn't try to run WDIO tests.

## Key Decisions

- **Radio click vs `selectByAttribute`**: ConfigureStep uses a `<fieldset>` with radio inputs, so tests click `[data-testid="quality-option-{value}"]` directly (not `selectByAttribute` on a select element).
- **`navigateToCompare` polls `'compare-step'`** — PDF's compare step testid, distinct from image's `'image-compare-step'`.
- **Archive quality**: only asserts output > 0 bytes (lossless preset — not expected to reduce size).

## Files Modified

| File | Change |
|---|---|
| `src/e2e/tests/pdf-flows.test.ts` | Created — 11 E2E tests |
| `vitest.config.ts` | Added `exclude: ['src/e2e/**']` |
| `tsconfig.json` | Added `exclude: ["src/e2e"]` (committed) |
| `tsconfig.e2e.json` | New — E2E compiler config (Mocha + wdio types) |

## Verification

- `npm run test` — **260/260 passed, 13 files** ✓
- `npx tsc --noEmit` — **clean** ✓
- `grep -c 'it(' src/e2e/tests/pdf-flows.test.ts` — **11** (≥ 10) ✓
- `grep 'data-testid="compare-step"' src/components/CompareStep.tsx` — **found** ✓
- `grep 'data-testid="file-size-limit-modal"' src/App.tsx` — **found** ✓
