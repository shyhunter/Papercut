---
phase: 05-pdf-real-compression-critical
verified: 2026-02-25T11:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "npx tsc --noEmit passes with zero errors across the entire project"
    status: failed
    reason: "6 TS6133 (noUnusedLocals) errors exist in integration test files added by feat(05-04) — an unplanned commit that landed after the 3 core phase 5 plans. The errors are in src/integration/__tests__/{02,03,04,05}-*.test.tsx (unused imports of 'act', 'fireEvent', 'FAKE_PDF_RESULT'). These files are NOT in any phase 5 plan's files_modified lists, but they are in the current codebase and the 05-03 success criterion explicitly requires zero TS errors."
    artifacts:
      - path: "src/integration/__tests__/02-pdf-configure.test.tsx"
        issue: "Unused imports: 'act', 'fireEvent' (line 14), 'FAKE_PDF_RESULT' (line 22)"
      - path: "src/integration/__tests__/03-pdf-compare.test.tsx"
        issue: "Unused import: 'act' (line 14)"
      - path: "src/integration/__tests__/04-image-flow.test.tsx"
        issue: "Unused import: 'act' (line 13)"
      - path: "src/integration/__tests__/05-e2e-flows.test.tsx"
        issue: "Unused import: 'act' (line 15)"
    missing:
      - "Remove or use the 'act', 'fireEvent', and 'FAKE_PDF_RESULT' imports in the four integration test files, or add @ts-expect-error suppressions. All 4 fixes are trivial import cleanup."
  - truth: "The 'structural only' notice in CompareStep is removed (success criterion 4)"
    status: partial
    reason: "The original dedicated notice block ('PDF compression is structural only — image content is unchanged. The quality level setting has no effect yet.') is fully removed. However, a residual phrase 'PDF optimisation is structural only.' remains at line 217 inside the target-not-met warning branch (only shown when targetMet=false AND wasAlreadyOptimal=false). This text is misleading — it implies GS compression is structural-only, but at this point GS HAS run and simply couldn't reach the target. The 05-03 plan specifically required the structural message to be 'completely removed' and the CONTEXT.md said 'Remove the structural only — image quality unchanged notice silently'. The remaining phrase, while in a different code path, carries the same false implication."
    artifacts:
      - path: "src/components/CompareStep.tsx"
        issue: "Line 217: 'PDF optimisation is structural only.' in target-not-met warning when wasAlreadyOptimal=false — misleading since GS compression did run"
    missing:
      - "Update line 217 text from 'PDF optimisation is structural only.' to something accurate like 'Try a lower quality level to reach the target.' which reflects that GS ran but could not compress further to hit the target."
human_verification:
  - test: "Verify real GS compression produces measurably different output in the running app"
    expected: "Processing photo_heavy.pdf with 'Web' quality should produce a file at least 20% smaller than 'Archive' quality on a real Mac with GS sidecar available"
    why_human: "The [PC-02/PC-03] test uses a mocked invoke — it cannot verify that the actual GS sidecar produces real size differences. Only a live run with the Tauri app and the bundled gs-aarch64-apple-darwin sidecar can confirm end-to-end real compression."
  - test: "Verify processing time < 30 s for a 10 MB PDF"
    expected: "Ghostscript sidecar completes compression of a 10 MB photo-heavy PDF in under 30 seconds on a modern Mac"
    why_human: "Processing time cannot be verified programmatically from tests — requires live app execution."
  - test: "Verify 'Suggested' badge appears on quality tile when target is entered"
    expected: "Typing '500 KB' in the target size field in ConfigureStep should show a 'Suggested' badge on one quality tile and auto-select that quality level"
    why_human: "This is a visual/interactive UI behavior that cannot be reliably verified without a running app."
---

# Phase 5: PDF Real Compression — Verification Report

**Phase Goal:** PDF quality levels produce measurably different, smaller output — the core PDF compression promise is actually delivered
**Verified:** 2026-02-25T11:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | "Low quality" output is measurably smaller than "High quality" output on a photo-heavy PDF (≥ 20% difference) | ? HUMAN | [PC-02/PC-03] test uses mocked invoke — GS returns mock bytes, not real compressed output. `processPdf` calls `invoke('compress_pdf', { sourcePath, preset })` with correct preset mapping. Real end-to-end difference requires live app run. |
| 2 | Text-only PDFs still process correctly (no regression on structural resize) | ✓ VERIFIED | [PC-REGRESSION-01] test confirmed in `pdfProcessor.test.ts` line 703-720. Uses `warnock_camelot.pdf` fixture. GS mock returns valid PDF, pageCount=6 verified. 260 tests pass. |
| 3 | [PC-02/PC-03] test now asserts real size difference (old identical-size assertion superseded) | ✓ VERIFIED | Test at line 488-520 of `pdfProcessor.test.ts` asserts `archiveResult.outputSizeBytes / webResult.outputSizeBytes >= 1.2` (≥ 20% ratio). Old describe block documenting identical sizes removed. |
| 4 | The "structural only" notice in CompareStep is removed or updated | ✗ PARTIAL | The original dedicated notice block (always-visible when delta < 2%) is fully removed. However, line 217 of `CompareStep.tsx` contains 'PDF optimisation is structural only.' in the target-not-met branch (when `wasAlreadyOptimal=false`) — this is a different code path but carries a misleading implication that GS compression is structural-only when it is not. |
| 5 | Processing time is acceptable (< 30 s for a 10 MB PDF on a modern Mac) | ? HUMAN | Cannot verify programmatically. Requires live app execution with the bundled GS sidecar. |

**Score:** 3/5 criteria fully verified automated, 2 need human, 1 partial (residual misleading text)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src-tauri/binaries/gs-aarch64-apple-darwin` | Ghostscript sidecar binary (15 MB) | ✓ VERIFIED | 15 MB, executable, exists |
| `src-tauri/src/lib.rs` | compress_pdf Tauri command with preset validation, GS sidecar invocation, cancellation support | ✓ VERIFIED | Lines 137-255: compress_pdf async command, validates preset allow-list (screen/ebook/printer/prepress), spawns GS via tauri_plugin_shell, stores child in ProcessState for cancel_processing. Registered in generate_handler line 266. |
| `src-tauri/tauri.conf.json` | bundle.externalBin with gs declaration | ✓ VERIFIED | Line 41-43: `"externalBin": ["binaries/gs"]` |
| `src-tauri/capabilities/default.json` | shell:allow-execute with gs sidecar scope | ✓ VERIFIED | Line 28-29: identifier "shell:allow-execute" with `{ "name": "gs", "sidecar": true }` |
| `test-fixtures/photo_heavy.pdf` | Real 3-page image-heavy PDF > 1 MB | ✓ VERIFIED | 2.3 MB, PDF 1.7, 3 pages with embedded JPEG images |
| `src/types/file.ts` | PdfQualityLevel = 'web' \| 'screen' \| 'print' \| 'archive'; PdfProcessingResult with imageCount and compressibilityScore | ✓ VERIFIED | Line 15: correct type. Lines 52-53: imageCount and compressibilityScore in result interface. Also includes wasAlreadyOptimal (added for GS bloat guard). |
| `src/lib/pdfProcessor.ts` | invoke('compress_pdf'), QUALITY_TO_GS_PRESET map, scanPdfImages, recommendQualityForTarget export | ✓ VERIFIED | Lines 6 (invoke import), 11-16 (QUALITY_TO_GS_PRESET), 40-85 (scanPdfImages), 90-109 (recommendQualityForTarget), 194-197 (GS invocation). All exports confirmed. |
| `src/lib/__tests__/pdfProcessor.test.ts` | [PC-02/PC-03] ratio test, [PC-REGRESSION-01], [PC-RESIZE-COMPRESS-01], GS mock, new quality labels | ✓ VERIFIED | Lines 488 (PC-02/03), 703 (PC-REGRESSION-01), 722 (PC-RESIZE-COMPRESS-01). baseOpts uses 'screen' (not 'medium'). invoke mocked via `vi.mock('@tauri-apps/api/core')`. |
| `src/components/ConfigureStep.tsx` | Web/Screen/Print/Archive labels, 'screen' default, recommendQualityForTarget wired to target input | ✓ VERIFIED | Lines 23-28 (QUALITY_LEVELS), 52 (useState 'screen'), 177 (recommendQualityForTarget call), 7 (import). Suggested badge at lines 144-148. |
| `src/components/CompareStep.tsx` | Structural notice removed, X→Y (Z% smaller) format, qualityLevel prop, QUALITY_RENDER_SCALE | ✓ VERIFIED (with caveat) | Old notice block gone. Line 256: `formatBytes(result.inputSizeBytes) → formatBytes(result.outputSizeBytes)`. Lines 44-48 (QUALITY_RENDER_SCALE). Line 10 (qualityLevel prop). Residual 'structural only' text at line 217 (see gaps). |
| `src/App.tsx` | lastPdfQualityLevel state, qualityLevel prop passed to CompareStep | ✓ VERIFIED | Line 57 (state), 216 (set on preview), 342 (passed to CompareStep). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src-tauri/src/lib.rs` | Ghostscript sidecar | `app.shell().sidecar("gs")` | ✓ WIRED | Lines 164-178: sidecar("gs") called with GS args, spawned, event loop waits for Terminated |
| `src-tauri/tauri.conf.json` | Ghostscript binary | `bundle.externalBin: ["binaries/gs"]` | ✓ WIRED | Line 41-43 confirmed |
| `src/lib/pdfProcessor.ts` | compress_pdf Tauri command | `invoke('compress_pdf', { sourcePath, preset })` | ✓ WIRED | Lines 194-197: invoke called with sourcePath (temp file path) and preset from QUALITY_TO_GS_PRESET |
| `src/types/file.ts` | `src/lib/pdfProcessor.ts` | PdfQualityLevel imported and used in QUALITY_TO_GS_PRESET | ✓ WIRED | Line 7 imports PdfQualityLevel, line 11 uses as Record key |
| `src/components/ConfigureStep.tsx` | `src/lib/pdfProcessor.ts` | recommendQualityForTarget imported and called on target input change | ✓ WIRED | Line 7 import, line 177 call |
| `src/components/CompareStep.tsx` | `src/types/file.ts` | PdfQualityLevel used for QUALITY_RENDER_SCALE; qualityLevel prop drives getAfterRenderScale | ✓ WIRED | Line 6 import, line 51-53 (getAfterRenderScale uses qualityLevel), line 152 (renders After panel with quality-derived scale) |
| `src/App.tsx` | `src/components/CompareStep.tsx` | lastPdfQualityLevel state → qualityLevel prop | ✓ WIRED | Line 342: `qualityLevel={lastPdfQualityLevel}` |

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| PDF-01 | 05-01, 05-02, 05-03 | User can compress a PDF to a specified target file size | ✓ SATISFIED | GS sidecar invoked with quality preset; targetSizeBytes honored; targetMet/bestAchievableSizeBytes in result; processPdf fully wired to GS. |
| PDF-02 | 05-03 | User can resize PDF page dimensions | ✓ SATISFIED | Existing resize pipeline unchanged; [PC-RESIZE-COMPRESS-01] confirms resize + compression work together correctly (post-resize bytes passed to GS). |
| PDF-03 | 05-03 | User sees estimated output file size before committing to save | ✓ SATISFIED | CompareStep now shows `X MB → Y MB (Z% smaller)` format at line 256-260. |
| PDF-04 | 05-01, 05-02, 05-03 | (Internal — real Ghostscript compression replaces structural-only pdf-lib re-save) | ✓ SATISFIED | GS compression pipeline fully operational. Note: PDF-04 does not appear in REQUIREMENTS.md — it is a phase-internal requirement identifier used in plan frontmatter only. It is not an orphaned requirement; REQUIREMENTS.md has only PDF-01, PDF-02, PDF-03 for PDF processing. |

**Orphaned requirements check:** PDF-04 is declared in all three plan frontmatter files but does not appear in REQUIREMENTS.md. This is a phase-internal requirement (not a v1 user-facing requirement). No true orphaned requirements from REQUIREMENTS.md are unaccounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/CompareStep.tsx` | 217 | `'PDF optimisation is structural only.'` in target-not-met branch when GS compression IS running | Warning | Misleading message — implies GS compression is structural when in fact GS ran but the file is hard to compress further. Should read something like "Try a lower quality level." |
| `src/integration/__tests__/02-pdf-configure.test.tsx` | 14, 22 | Unused imports: `act`, `fireEvent`, `FAKE_PDF_RESULT` | Warning | Causes `tsc --noEmit` to fail (TS6133). Tests still pass because Vitest ignores unused imports. Added by unplanned feat(05-04) commit. |
| `src/integration/__tests__/03-pdf-compare.test.tsx` | 14 | Unused import: `act` | Warning | Same issue as above. |
| `src/integration/__tests__/04-image-flow.test.tsx` | 13 | Unused import: `act` | Warning | Same issue as above. |
| `src/integration/__tests__/05-e2e-flows.test.tsx` | 15 | Unused import: `act` | Warning | Same issue as above. |

### Human Verification Required

#### 1. Real GS Compression Produces Measurably Different Output

**Test:** Open `test-fixtures/photo_heavy.pdf` in the running app. Process with "Web" quality. Note output size. Click Back. Process again with "Archive" quality. Note output size.
**Expected:** Web output should be at least 20% smaller than Archive output (e.g., Archive = 2.3 MB → Web = 0.5 MB or less)
**Why human:** The [PC-02/PC-03] test mocks `invoke` — it does not call the real Ghostscript sidecar. Only a live app run with the bundled `gs-aarch64-apple-darwin` binary can confirm real image recompression works.

#### 2. Processing Time < 30 Seconds for 10 MB PDF

**Test:** Process a ~10 MB photo-heavy PDF on a modern Mac with the running Tauri app. Time from "Generate Preview" click to CompareStep render.
**Expected:** Completes within 30 seconds
**Why human:** Processing time cannot be measured in unit tests.

#### 3. Target Size Auto-Suggestion in UI

**Test:** Open any PDF in the app. In ConfigureStep, type "500 KB" in the target size field.
**Expected:** A "Suggested" badge appears on one of the quality tiles and that quality is auto-selected. Manual override (clicking a different quality) is respected.
**Why human:** Visual badge rendering and interactive state require a running browser/app.

### Gaps Summary

**Gap 1: TypeScript compiler fails (`tsc --noEmit` exits 2)**
Four integration test files (`02-pdf-configure.test.tsx`, `03-pdf-compare.test.tsx`, `04-image-flow.test.tsx`, `05-e2e-flows.test.tsx`) contain unused imports (`act`, `fireEvent`, `FAKE_PDF_RESULT`) that trigger TS6133 errors. These files were added by the unplanned `feat(05-04)` commit (2026-02-24 16:07) — after the three core phase 5 plans completed. The 260 tests all pass. The TS errors are trivial import cleanup. The 05-03 success criterion "npx tsc --noEmit passes with zero errors" fails.

**Gap 2: Residual misleading "structural only" text in CompareStep**
The primary structural-only notice block (always shown when size delta < 2%, claiming GS compression has no effect) was correctly removed. However, a new, different code path in the target-not-met warning still says "PDF optimisation is structural only." (line 217) when `targetMet=false AND wasAlreadyOptimal=false`. This is factually wrong — GS compression DID run, it just could not reach the target. The PLAN (05-03) and CONTEXT.md called for the structural language to be completely removed. This residual text is a minor accuracy issue.

---

_Verified: 2026-02-25T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
