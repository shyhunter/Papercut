---
phase: 14-security-privacy-hardening
verified: 2026-03-15T13:22:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 14: Security & Privacy Hardening Verification Report

**Phase Goal:** The app is safe against all known security vulnerabilities and provides strong, verifiable privacy guarantees to users — no data leaks, no injection vectors, no unsafe file handling
**Verified:** 2026-03-15T13:22:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (All Plans Combined)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Filenames with shell-dangerous chars are rejected before any shell command | VERIFIED | `validate_filename_chars()` in lib.rs L38-55; character set excludes backticks, semicolons, dollar signs, quotes, pipes |
| 2 | Path traversal attempts are rejected in every Tauri IPC command accepting a path | VERIFIED | `validate_source_path()` called at L173, 249, 285, 404, 468, 529, 627, 715, 893, 1075, 1121, 1225 — 12 call sites covering all path-accepting commands |
| 3 | Calibre extra_args validated against flag allow-list | VERIFIED | `validate_calibre_extra_args()` defined L66-80; `CALIBRE_ALLOWED_FLAGS` constant at L58-64 |
| 4 | Frontend mirrors filename validation | VERIFIED | `isFilenameSafe()` in `fileValidation.ts` L51-57 with matching Unicode-aware regex |
| 5 | CSP blocks inline scripts (script-src 'self', no unsafe-inline for scripts) | VERIFIED | `tauri.conf.json` L28: `"script-src 'self'"` without unsafe-inline in that directive |
| 6 | CSP blocks external network connections | VERIFIED | `connect-src ipc: http://ipc.localhost` — only Tauri internal IPC, no external http/https |
| 7 | Inline styles still work (Tailwind compatibility) | VERIFIED | `style-src 'self' 'unsafe-inline'` present in CSP |
| 8 | Temp files use UUID-based names | VERIFIED | `Uuid::new_v4()` used at L299, 411, 475, 511, 542, 549, 630, 727, 908, 1087, 1124 — 11 locations; no `subsec_nanos` remains |
| 9 | Startup sweep deletes orphan temp files older than 1 hour | VERIFIED | `fn sweep_papercut_temp_files()` at L1276; called in `.setup()` hook at L1319 |
| 10 | LibreOffice profile directory cleaned up after conversion | VERIFIED | `remove_dir_all(&lo_profile_dir)` at L809, 830, 879 — success path, error path, and deferred cleanup |
| 11 | GS error messages never contain plaintext passwords | VERIFIED | `fn redact_gs_passwords()` at L1257; called at L450, L511 in protect_pdf/unlock_pdf error paths |
| 12 | Privacy modal accessible from footer with human-readable promise and technical details | VERIFIED | `PrivacyModal.tsx` — shield icon, three promise paragraphs, `<details>/<summary>` collapsible technical section |
| 13 | First-launch banner appears once and is permanently dismissible | VERIFIED | `FirstLaunchBanner.tsx` uses LazyStore `privacy-banner-dismissed` key; `store.save()` called on dismiss |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src-tauri/src/lib.rs` | validate_source_path(), validate_filename_chars(), validate_calibre_extra_args(), sweep_papercut_temp_files(), redact_gs_passwords() | VERIFIED | All five functions present and substantive |
| `src/lib/fileValidation.ts` | isFilenameSafe(), UNSAFE_FILENAME_MESSAGE | VERIFIED | Both exported at L51-61 |
| `src-tauri/tauri.conf.json` | Strict CSP with default-src 'self' | VERIFIED | Full CSP string at L28 |
| `src-tauri/capabilities/default.json` | Tightened capabilities, no http: permissions | VERIFIED | No `http:` permission identifiers present |
| `src/components/PrivacyModal.tsx` | Full modal with promise + collapsible technical section | VERIFIED | Shield icon, 3 promise blocks, `<details>` section with 7 technical bullet points |
| `src/components/FirstLaunchBanner.tsx` | One-time banner with LazyStore persistence | VERIFIED | Uses LazyStore, stores `privacy-banner-dismissed`, calls `store.save()` |
| `src/components/PrivacyFooter.tsx` | Clickable button opening PrivacyModal | VERIFIED | Button with onClick opens PrivacyModal via local useState |
| `src/lib/__tests__/security.test.ts` | Static analysis suite (8 tests) | VERIFIED | 8 tests, all passing |
| `src/lib/__tests__/privacy.test.ts` | CSP configuration tests (4 new tests) | VERIFIED | 4 CSP tests + pre-existing capability test, all passing |
| `src/lib/__tests__/fileValidation.test.ts` | isFilenameSafe tests (11 new tests) | VERIFIED | 11 isFilenameSafe tests all passing (2 pre-existing failures from Phase 13 are unrelated to Phase 14 scope) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Every `#[tauri::command]` accepting a path | `validate_source_path()` | function call as first operation | WIRED | 12 call sites confirmed in lib.rs |
| `validate_source_path()` | `validate_filename_chars()` | call at L31 | WIRED | Chained within validate_source_path |
| `convert_with_calibre` | `validate_calibre_extra_args()` | called before processing | WIRED | Present at L627 command body |
| Tauri `.setup()` hook | `sweep_papercut_temp_files()` | Builder::default().setup() | WIRED | L1318-1321 confirmed |
| `protect_pdf` / `unlock_pdf` error paths | `redact_gs_passwords()` | wraps stderr in Err() | WIRED | L450, L511 confirmed |
| `src/components/PrivacyFooter.tsx` | `PrivacyModal` | useState toggle on button click | WIRED | L3 import, L18 render with open={showModal} |
| `src/components/FirstLaunchBanner.tsx` | `PrivacyModal` | "Learn more" button + local useState | WIRED | L4 import, L68 render |
| `src/App.tsx` | `FirstLaunchBanner` | rendered when activeTool === null | WIRED | L21 import, L672 conditional render |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UX-03 | 14-01, 14-02, 14-03, 14-04 | No file data sent to external server | SATISFIED | CSP blocks external connections; no HTTP capability permissions; all processing local; privacy modal documents this explicitly |

**Note on traceability table:** REQUIREMENTS.md shows UX-03 as "Phase 4 / Complete" — this was its original phase mapping (phase 4 = polish). Phase 14 deepens and formalizes the guarantee with verifiable technical controls. No orphaned requirements detected.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/lib/__tests__/fileValidation.test.ts` L110-112 | Pre-existing test failures: `detectFormat('document.docx')` expected null but returns `"document"` | INFO | Pre-existing from Phase 13 adding docx support; logged in deferred-items.md; not caused by Phase 14 |
| `src/lib/__tests__/fileValidation.test.ts` L48-53 | Pre-existing: `isSupportedFile('report.docx')` expected false but returns true | INFO | Same root cause as above |

No blockers found. Both issues predate Phase 14 and are documented.

---

## Human Verification Required

### 1. PrivacyModal renders correctly in app

**Test:** Launch app, click "Processed locally · Privacy" in footer
**Expected:** Modal opens showing shield icon, three privacy promise paragraphs, collapsible "Technical details" section, and Close button
**Why human:** Visual rendering and interactive collapse cannot be verified by static analysis

### 2. FirstLaunchBanner one-time behavior

**Test:** Clear `papercut-settings.json` LazyStore or fresh install; launch app; verify banner appears; dismiss with X; relaunch
**Expected:** Banner shows on first launch, does not reappear after dismissal
**Why human:** Requires runtime interaction with Tauri's LazyStore persistence across app restarts

### 3. "Learn more" link in banner opens modal

**Test:** On first launch, click "Learn more" in banner
**Expected:** PrivacyModal opens (separate from footer modal instance)
**Why human:** Requires runtime UI interaction

---

## Gaps Summary

No gaps. All 13 observable truths verified against the actual codebase. All key artifacts exist, are substantive (not stubs), and are correctly wired.

The two test failures in `fileValidation.test.ts` are pre-existing regressions from Phase 13 (docx added as supported format without updating old tests). They do not block or contradict any Phase 14 security guarantee. They are documented in `deferred-items.md`.

The security test suite (security.test.ts: 8 tests, privacy.test.ts: 6 tests) all pass cleanly. The static analysis tests provide automated regression guards for all hardening measures — if any validate_source_path call is removed or subsec_nanos is reintroduced, tests will fail.

---

_Verified: 2026-03-15T13:22:00Z_
_Verifier: Claude (gsd-verifier)_
