# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can reduce, resize, and convert documents locally in seconds -- zero uploads, zero privacy compromise.
**Current focus:** Phase 8: UX Polish / New Features

## Current Position

Phase: 08-newfeatures
**Current Plan:** 4 (complete)
**Total Plans in Phase:** 5
**Status:** In progress
**Last Activity:** 2026-03-01

Progress: [████░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 8 min
- Total execution time: 0.14 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-app-shell-file-input | 3/3 (complete) | 38 min | 13 min |

**Recent Trend:**
- Last 5 plans: 8 min, 10 min, 6 min
- Trend: -

*Updated after each plan completion*

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-pdf-processing | 3/3 (complete) | 2 min | 2 min |
| Phase 02-pdf-processing P02 | 3 | 3 tasks | 4 files |
| Phase 03-image-processing P01 | 2 | 2 tasks | 5 files |
| Phase 03-image-processing P02 | 3 | 2 tasks | 2 files |
| Phase 03-image-processing P03 | 5 | 2 tasks | 3 files |
| Phase 04-polish-trust P01 | 4 | 3 tasks | 10 files |
| Phase 04-polish-trust P02 | 2 | 1 tasks | 2 files |
| Phase 05-pdf-real-compression-critical P01 | 6 | 3 tasks | 9 files |
| Phase 05-pdf-real-compression-critical P02 | 8 | 3 tasks | 4 files |
| Phase 06-safety-hardening-high P1 | 10 | 1 tasks | 7 files |
| Phase 06-safety-hardening-high P06-02 | 7 | 2 tasks | 8 files |
| Phase 06-safety-hardening-high P06-03 | 10 | 1 tasks | 3 files |
| Phase 05 P03 | 5 | 3 tasks | 5 files |
| Phase 07-e2e-test-automation-high P07-01 | 11 | 2 tasks | 10 files |
| Phase 07-e2e-test-automation-high P07-02 | 8 | 2 tasks | 6 files |
| Phase 07-e2e-test-automation-high P07-03 | 8 | 2 tasks | 3 files |
| Phase 08 P04 | 3 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 4 phases (shell, PDF, image, polish). UX-02 (save dialog) assigned to Phase 2, reused in Phase 3.
- Architecture: Tauri backend handles all file processing; React frontend is pure UI. Stateless processors.
- 01-01: Tailwind v4 via @tailwindcss/vite Vite plugin, NOT PostCSS — no tailwind.config.js needed
- 01-01: dialog:allow-open only (not dialog:default) for minimal permission surface
- 01-01: dragDropEnabled true (default) required for Tauri onDragDropEvent API
- 01-01: minWidth AND minHeight both set — Tauri known issue: minWidth alone has no effect
- 01-01: shadcn/ui Neutral theme with CSS variables for consistent theming
- [Phase 01-app-shell-file-input]: useFileDrop uses ref pattern for stable Tauri event listener callback — prevents re-registration on every render
- [Phase 01-app-shell-file-input]: Invalid drop signaled via empty string sentinel (onFileDrop('')) rather than separate callback — simpler hook API
- [Phase 01-app-shell-file-input]: StepBar non-interactive in Phase 1 — steps only advance via file load/reset operations
- [Phase 01-app-shell-file-input]: StepBar uses numbered circles (Claude Discretion) with inline checkmark SVG for completed states
- [Phase 02-pdf-processing]: useObjectStreams-only save: never useCompression (pdf-lib bug #1445 corrupts output)
- [Phase 02-pdf-processing]: usePdfProcessor run() uses Omit<PdfProcessingOptions, 'onProgress'> — hook owns progress callback wiring
- [Phase 02-pdf-processing]: dialog:allow-save added in 02-01 alongside fs permissions so all capabilities are co-located
- [Phase 02-pdf-processing]: pdfjs-dist v4 requires canvas (HTMLCanvasElement) as primary RenderParameters field — canvasContext is deprecated
- [Phase 02-pdf-processing]: CompareStep target-not-met warning is informational only — Save button never disabled based on targetMet
- [Phase 02-pdf-processing]: getPdfPageCount lazy-loads pdf-lib in App.tsx to avoid startup cost
- [Phase 03-image-processing]: Use webp crate (not image crate) for lossy WebP — image crate's WebP encoder is lossless only
- [Phase 03-image-processing]: Manual pixel compositing loop for PNG->JPEG white fill — imageops::overlay has known borrow issues
- [Phase 03-image-processing]: getImageDimensions uses browser createImageBitmap — no extra Rust round-trip needed
- [Phase 03-image-processing]: Slider fires handleSubmit on onMouseUp/onTouchEnd — same code path as Generate Preview button
- [Phase 03-image-processing]: fileSizeBytes=0 from App.tsx; FileEntry has no sizeBytes field; component hides display when 0
- [Phase 03-image-processing]: Blob URLs created in separate useEffect per image (source vs processed) with URL.revokeObjectURL cleanup to prevent memory leaks
- [Phase 03-image-processing]: Stale-result overlay: isProcessing=true + processedUrl already set → opacity-40 + Regenerating badge — never blank screen between regeneration cycles
- [Phase 03-image-processing]: SaveStep extended with optional defaultSaveName and saveFilters props using ?? fallback for PDF backward compatibility
- [Phase 04-polish-trust]: LazyStore.save() always called explicitly after set() — no auto-persist; missing this loses data between sessions
- [Phase 04-polish-trust]: fs:allow-exists must have allow scope ($HOME/**) or Tauri throws forbidden path at runtime
- [Phase 04-polish-trust]: Invalid drop error: inline text on LandingCard (not toast) — auto-clears in 2.5s
- [Phase 04-polish-trust]: Corrupt-file useEffect watchers intentionally omit exhaustive deps to match existing App.tsx pattern
- [Phase 04-polish-trust]: capPath resolved via path.join(__dirname, '../../../src-tauri/capabilities/default.json') — relative to test file for consistent resolution
- [Phase 04-polish-trust]: Privacy tests: vi.unstubAllGlobals() in afterAll ensures fetch mock never leaks to other test files
- [Phase 05-pdf-real-compression-critical]: Ghostscript installed via Homebrew and binary copied to src-tauri/binaries/gs-aarch64-apple-darwin for Tauri sidecar
- [Phase 05-pdf-real-compression-critical]: Temp file lifecycle in compress_pdf managed via Rust stdlib (std::fs), not Tauri FS plugin — no JS-side TEMP permissions needed for the Rust command
- [Phase 05-pdf-real-compression-critical]: fs:allow-write-file and fs:allow-remove scoped to $TEMP/** added for Plan 02 JS-side temp PDF operations
- [Phase 05-pdf-real-compression-critical]: photo_heavy.pdf generated via Node.js pdf-lib script (not Rust/lopdf) — simpler, uses existing pdf-lib dep
- [Phase 05-pdf-real-compression-critical]: compress_pdf preset allow-list: screen, ebook, printer, prepress (GS native -dPDFSETTINGS values)
- [Phase 05-pdf-real-compression-critical]: Type-safe pdf-lib scan uses Resources()+lookupMaybe() — PDFObject has no resolve(); lookupMaybe handles ref resolution automatically
- [Phase 05-pdf-real-compression-critical]: Dimension tests use compressionEnabled=false — GS mock output is not a parseable PDF; resize tests verify geometry not compression
- [Phase 05-pdf-real-compression-critical]: Post-resize bytes passed to GS — pdfDoc.save({ useObjectStreams: false }) when resizeEnabled=true so GS receives resized bytes, not sourceBytes
- [Phase 06-safety-hardening-high]: getFileSizeBytes uses readFile (not stat API) — readFile already permitted, no new capability needed
- [Phase 06-safety-hardening-high]: File size limit modal is a plain Tailwind fixed overlay — shadcn Dialog not installed in this project
- [Phase 06-safety-hardening-high]: Load-time failures (zero-byte, >100MB, readFile error) show inline errors; mid-flow processing failures keep toasts
- [Phase 06-safety-hardening-high]: ProcessState uses Mutex<Option<CommandChild>> — CommandChild.kill(self) consumes so Option+take() pattern required; oneshot channel not needed
- [Phase 06-safety-hardening-high]: compress_pdf uses .spawn() + event loop instead of .output() to enable real GS kill; returns Err('CANCELLED') on kill
- [Phase 06-safety-hardening-high]: CompareStep result prop made optional — isCancelled guard renders cancelled view before any result field access
- [Phase 06-safety-hardening-high]: lastPdfOptionsRef stores last PDF options enabling Retry to re-run with identical settings without user re-entering them
- [Phase 06-safety-hardening-high]: ErrorBoundary: class components required (React API); StepErrorBoundary reset preserves file state; AppErrorBoundary uses window.location.reload(); shared BoundaryFallback component for DRY UI
- [Phase 05]: Neutral compressibilityScore 0.5 used for pre-processing quality hint — real score only available after GS processes the PDF
- [Phase 07-e2e-test-automation-high]: Used @crabnebula/tauri-driver (not tauri-driver) for Tauri v2 WebDriver; uses beforeSession/afterSession hooks not services array
- [Phase 07-e2e-test-automation-high]: process-another-btn testid added to CompareStep.tsx and ImageCompareStep.tsx (not SaveStep.tsx where plan stated) -- button lives in Compare step
- [Phase 07-e2e-test-automation-high]: navigateToImageCompare polls 'image-compare-step' not 'compare-step' — image and PDF compare steps have distinct testids
- [Phase 07-e2e-test-automation-high]: Magic byte verification (readFileSync) used for format assertions — confirms actual output format not just filename extension
- [Phase 07-e2e-test-automation-high]: Radio click pattern used for quality options (quality-option-{value} click, not selectByAttribute) — ConfigureStep uses fieldset/radio not a select element
- [Phase 08]: Root font-size drives all rem-based Tailwind scaling via clamp(14px, 1.2vw + 0.4vh, 20px)

### Roadmap Evolution

- Phase 8 added: NewFeatures

### Pending Todos

None.

### Blockers/Concerns

**QA Audit — 2026-02-21** (recorded as future phases 5–7 in ROADMAP.md):

| Priority | Concern | Phase |
|----------|---------|-------|
| Critical | PDF quality levels produce identical output — pdf-lib has no image recompression API | Phase 5 (in progress) |
| High | No file size guard or cancellation — large/corrupt files cause silent hang | Phase 6 |
| High | Zero automated E2E coverage — full open->configure->compare->save path is manual-only | Phase 7 |
| Low | Connected integration test missing — tests verify params passed to Rust but not Rust output | Phase 6 |

Note: Rust toolchain required — installed via rustup during plan 01-01 execution.

## Session Continuity

Last session: 2026-02-27
Stopped at: Phase 8 context gathered
Resume file: .planning/phases/08-newfeatures/08-CONTEXT.md
