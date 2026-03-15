# Roadmap: Papercut

## Overview

Papercut delivers a privacy-first desktop app for compressing, resizing, and converting PDFs and images -- all processed locally, never uploaded. The roadmap builds vertically: first a working app shell with file input, then complete PDF processing, then complete image processing, and finally the convenience and trust features that round out the experience.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: App Shell & File Input** - Tauri + React scaffold with file picker, drag-and-drop, and step navigation (completed 2026-02-19)
- [x] **Phase 2: PDF Processing** - Compress, resize, and preview PDFs with save-to-disk output (completed 2026-02-20)
- [x] **Phase 3: Image Processing** - Compress, resize, convert, and compare images before saving (completed 2026-02-21)
- [x] **Phase 4: Polish & Trust** - Recent directory shortcuts and privacy verification (completed 2026-02-23)

## Phase Details

### Phase 1: App Shell & File Input
**Goal**: Users can launch the app, open any supported file, and see where they are in the processing workflow
**Depends on**: Nothing (first phase)
**Requirements**: FINP-01, FINP-02, UX-01
**Success Criteria** (what must be TRUE):
  1. User can launch the app and see a clean landing screen with a file picker button and a drop zone
  2. User can select a PDF or image file (JPG, PNG, WebP) via the native file picker dialog and see it loaded into the app
  3. User can drag a supported file onto the app window and see it loaded (same result as file picker)
  4. User can see a step progress indicator (Pick, Configure, Compare, Save) with the current step highlighted
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Tauri + React project scaffold, Tailwind v4, shadcn/ui, window config, shared types
- [x] 01-02-PLAN.md — File input: native picker + whole-window drag-and-drop, LandingCard, format detection
- [x] 01-03-PLAN.md — StepBar component (Pick → Configure → Compare → Save) and App.tsx integration

### Phase 2: PDF Processing
**Goal**: Users can take any PDF, compress it to a target size or resize its pages, preview the result size, and save the output locally
**Depends on**: Phase 1
**Requirements**: PDF-01, PDF-02, PDF-03, UX-02
**Success Criteria** (what must be TRUE):
  1. User can open a PDF and compress it toward a specified target file size (e.g. "under 2MB") and see the output size
  2. User can resize PDF page dimensions using presets (A4, A3, Letter) or custom width x height values
  3. User can see the estimated output file size before committing to save
  4. User can save the processed PDF to a chosen local path via a Save As dialog
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — PDF processing engine: pdf-lib + pdfjs-dist dependencies, pdfProcessor.ts, usePdfProcessor hook, Tauri plugin-fs wiring
- [x] 02-02-PLAN.md — Configure and Compare UI: ConfigureStep.tsx, CompareStep.tsx, pdfThumbnail.ts, App.tsx integration
- [x] 02-03-PLAN.md — Save flow: SaveStep.tsx, native Save As dialog, file write, post-save toast

### Phase 3: Image Processing
**Goal**: Users can compress, resize, convert, and visually compare images before saving -- the complete image workflow
**Depends on**: Phase 1 (reuses file input and navigation shell; Phase 2 save dialog also reused)
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04
**Success Criteria** (what must be TRUE):
  1. User can adjust image compression quality via a slider (1-100%) and see the effect on file size
  2. User can resize image dimensions (width x height) with an aspect ratio lock toggle that prevents distortion
  3. User can convert between JPG, PNG, and WebP output formats
  4. User can see a side-by-side comparison of the original image vs the processed result before saving
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Rust image processing engine (image + webp crates), process_image Tauri command, ImageProcessingOptions/Result types, useImageProcessor hook
- [x] 03-02-PLAN.md — ImageConfigureStep: quality slider (mouse-up, % + size label, PNG remapping), format selector, resize toggle with W×H/aspect ratio lock/presets, App.tsx wiring
- [x] 03-03-PLAN.md — ImageCompareStep: side-by-side panels with Blob URLs, stale-result regenerating indicator, zoom, stats bar; SaveStep extended for images; App.tsx complete image flow

### Phase 4: Polish & Trust
**Goal**: The app feels complete and trustworthy -- quick access to recent folders and verified zero-network-call operation
**Depends on**: Phase 3
**Requirements**: FINP-03, UX-03
**Success Criteria** (what must be TRUE):
  1. App remembers recently used directories and offers them as shortcuts when opening the file picker
  2. No file data is ever sent to any external server (verified: no outbound network calls during any processing operation)
  3. App handles edge cases gracefully (unsupported file types, corrupted files, cancelled operations) without crashing
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — tauri-plugin-store setup, useRecentDirs hook, RecentDirsButton popover, PrivacyFooter, error hardening (invalid drop inline error, corrupt file toast+reset, save cancel toast)
- [ ] 04-02-PLAN.md — Privacy verification tests: static capabilities config assertion + runtime window.fetch spy

---

### Phase 5: PDF Real Compression ⚠️ Critical
**Goal**: PDF quality levels produce measurably different, smaller output — the core PDF compression promise is actually delivered
**Depends on**: Phase 2 (PDF pipeline complete)
**Origin**: QA audit 2026-02-21 — pdf-lib has no image recompression API; all quality levels currently produce identical output
**Success Criteria** (what must be TRUE):
  1. "Low quality" output is measurably smaller than "High quality" output on a photo-heavy PDF (≥ 20% difference)
  2. Text-only PDFs still process correctly (no regression on structural resize)
  3. The existing test `[PC-02/PC-03] all 4 quality levels produce identical output size` now FAILS — confirming real compression works — and is then updated to assert a real size difference
  4. The "structural only" notice in CompareStep is removed or updated to reflect real compression now exists
  5. Processing time is acceptable (< 30 s for a 10 MB PDF on a modern Mac)
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — GS sidecar setup (tauri-plugin-shell, gs binary, tauri.conf.json), compress_pdf Rust command, photo-heavy PDF fixture
- [x] 05-02-PLAN.md — TypeScript pipeline update: PdfQualityLevel rename (web/screen/print/archive), pdfProcessor.ts GS invocation + pre-scan, quality recommendation logic, updated tests
- [x] 05-03-PLAN.md — UI update: ConfigureStep quality labels + target-driven recommendation, CompareStep structural notice removal + percentage display, CompareStep tests, TEST_PLAN.md

---

### Phase 6: Safety & Hardening 🟠 High
**Goal**: The app never hangs, crashes, or silently fails — large files, corrupt inputs, and long operations all have a safe exit path
**Depends on**: Phase 3 (all pipelines complete)
**Origin**: QA audit 2026-02-21 — no file size guard, no cancellation, no error boundaries; a large file causes silent hang
**Success Criteria** (what must be TRUE):
  1. Dropping a file > 100 MB shows a clear warning before processing begins (user can cancel or proceed)
  2. A long-running Rust operation can be cancelled mid-flight; UI returns to Configure step without requiring app restart
  3. React error boundaries catch unexpected render failures and show a recoverable error state (not a blank screen)
  4. A corrupt or zero-byte file shows an explicit error message instead of a silent failure or crash
  5. All error paths are covered by automated tests (unit-level at minimum)
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — File size guard (hard cap at 100 MB with blocking modal) + zero-byte and corrupt-file inline errors
- [ ] 06-02-PLAN.md — Rust processing cancellation (cancel_processing command, tokio::select! GS kill, Cancel button in Configure steps, Cancelled state in CompareStep)
- [ ] 06-03-PLAN.md — React error boundaries (StepErrorBoundary + AppErrorBoundary) wrapping all steps in App.tsx

### Phase 8: UX Polish & Refinements
**Goal**: The app communicates compression limits clearly, offers custom target sizes, scales responsively with window size, and provides a polished save experience with file links and delight animations
**Depends on**: Phase 7
**Success Criteria** (what must be TRUE):
  1. Non-compressible files show an inline warning in Configure step and block progression to Compare
  2. Compressibility threshold info is always visible in Configure step
  3. A "Custom" 5th radio option lets users enter a target file size in MB or KB with validation
  4. Compare step shows full stats above panels with floating zoom toolbar and synced panel scrolling
  5. Save confirmation stays visible with X close button and clickable link to open the saved file
  6. "Process Another" renamed to "Start Over" in Compare step
  7. All UI elements (fonts, buttons, inputs, panels) scale proportionally with window size
**Plans**: 5 plans

Plans:
- [ ] 08-01-PLAN.md — ConfigureStep: compressibility feedback (inline warning + threshold info) + Custom quality option with MB/KB target size
- [ ] 08-02-PLAN.md — CompareStep + ImageCompareStep: stats row above panels, floating zoom toolbar, synced scrolling, "Start Over" label
- [ ] 08-03-PLAN.md — SaveStep: persistent confirmation card with file link, X close, animated success checkmark
- [ ] 08-04-PLAN.md — Responsive scaling: CSS clamp() root font-size + component-level viewport-aware sizing
- [ ] 08-05-PLAN.md — Visual verification checkpoint for all 7 success criteria

---

### Phase 7: E2E Test Automation 🟠 High
**Goal**: The critical user paths (open → configure → compare → save) are covered by automated tests that run without a human
**Depends on**: Phase 4 (app feature-complete)
**Origin**: QA audit 2026-02-21 — Sections 1, 4, 5, 9, 10, 11 of TEST_PLAN.md are 100% manual; regressions in the full app flow are undetectable without running the app by hand
**Success Criteria** (what must be TRUE):
  1. At least one full PDF flow (open → configure → compare → save) runs as an automated test
  2. At least one full image flow (open → configure → compare → save) runs as an automated test
  3. Save dialog file-type filter is verified automatically (PDF flow uses PDF filter, image flow uses correct image filter)
  4. Tests run in CI without a display server (headless)
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — WebDriverIO + tauri-driver scaffold, wdio.conf.ts, E2E fixtures (sparse large files + corrupt stubs), shared helpers (driver lifecycle + dialog.save() mock)
- [x] 07-02-PLAN.md — PDF E2E tests: 4 quality levels × 3 resize modes + 3 error paths + save dialog filter assertion (data-testid additions to PDF components)
- [x] 07-03-PLAN.md — Image E2E tests: quality-only + format conversion + resize (aspect lock + custom) + 2 error paths + 3 save dialog filter assertions (data-testid additions to image components)

---

### Phase 9: Dashboard & Multi-Tool Architecture
**Goal**: Transform Papercut from a single-purpose compression tool into a full document toolkit (like iLovePDF, but local and private) — starting with a dashboard entry point and the first batch of PDF tools (merge, split, rotate)
**Depends on**: Phase 8 (UX polish complete)
**Origin**: Feature backlog F9 — user vision for iLovePDF-style desktop app
**Success Criteria** (what must be TRUE):
  1. App launches to a dashboard showing available tools as cards/panels (compression is the first tool)
  2. Selecting a tool enters the existing Pick → Configure → Compare → Save flow (or a tool-specific flow)
  3. Users can merge multiple PDFs into one output file
  4. Users can split a PDF by page ranges or into individual pages
  5. Users can rotate selected pages (90°, 180°, 270°)
  6. Navigation allows returning to the dashboard from any tool
  7. Existing compression and image processing flows are fully preserved (no regressions)

---

### Phase 10: Quick-Win Tools + Compress Improvements
**Goal**: Double the dashboard from 5 to 11 tools with quick-win features, and improve the compress pipeline with new format support and metadata stripping
**Depends on**: Phase 9 (dashboard and multi-tool architecture)
**Origin**: iLovePDF feature analysis — prioritized by value/effort ratio
**Success Criteria** (what must be TRUE):
  1. PDF to JPG: User can export each page of a PDF as JPEG or PNG images
  2. JPG to PDF: User can convert one or more images into a single PDF with page size options
  3. Protect PDF: User can add password encryption to a PDF
  4. Unlock PDF: User can remove password protection from a PDF (given the password)
  5. Rotate Image: User can rotate images 90°/180°/270°
  6. Convert Image: User can convert images between JPG/PNG/WebP formats
  7. Compress accepts BMP, TIFF, and GIF as input image formats
  8. PDF compress has a metadata stripping toggle

Plans:
- [ ] 10-01-PLAN.md — Tool registry expansion (6 new ToolIds), Dashboard icon mapping, App.tsx routing stubs
- [ ] 10-02-PLAN.md — PDF to JPG: pdfjs page rendering to JPEG/PNG with DPI options, multi-file SaveStep output
- [ ] 10-03-PLAN.md — JPG to PDF: multi-image picker, pdf-lib embedding, page size/orientation/margin options
- [ ] 10-04-PLAN.md — Protect + Unlock PDF: GS sidecar encryption commands, password UI, injection prevention
- [ ] 10-05-PLAN.md — Rotate Image + Convert Image: Rust rotate command, format conversion flow
- [ ] 10-06-PLAN.md — Compress improvements: BMP/TIFF/GIF input support, PDF metadata stripping toggle

---

### Phase 11: P2 Visual PDF Tools
**Goal**: Add visual PDF manipulation tools — page numbers, watermark, crop, and organize pages
**Depends on**: Phase 9 (dashboard architecture)
**Origin**: iLovePDF feature analysis — P2 visual tools
**Success Criteria** (what must be TRUE):
  1. User can add page numbers with configurable position, format, and font size
  2. User can add text watermarks with opacity, rotation, and color options
  3. User can crop PDF pages by adjusting margins
  4. User can organize PDF pages (reorder, delete, duplicate)
  5. All 4 tools accessible from dashboard and fully functional

Plans:
- [x] 11-01-PLAN.md — Register 4 new P2 visual tools with routing stubs
- [x] 11-02-PLAN.md — Page Numbers tool with position/format/size options
- [x] 11-03-PLAN.md — Watermark tool with text/opacity/rotation/color
- [x] 11-04-PLAN.md — Crop PDF tool with margin-based cropping
- [x] 11-05-PLAN.md — Organize PDF tool with reorder/delete/duplicate
- [x] 11-06-PLAN.md — Wire all P2 visual tools into App.tsx routing

---

### Phase 12: Advanced PDF Tools
**Goal**: Add advanced PDF tools — sign, redact, PDF/A conversion, and repair — completing Papercut's professional PDF toolkit
**Depends on**: Phase 9 (dashboard architecture), Phase 5 (GS sidecar for PDF/A and repair)
**Origin**: Feature backlog P4 — advanced PDF tools
**Success Criteria** (what must be TRUE):
  1. User can add a visual signature stamp (draw/type/upload) to any page of a PDF
  2. User can redact (permanently remove) selected text or areas from a PDF
  3. User can convert a PDF to PDF/A archival format via Ghostscript
  4. User can repair a corrupted or malformed PDF via Ghostscript re-processing
  5. All 4 tools accessible from dashboard and fully functional
**Plans**: 5 plans

Plans:
- [ ] 12-01-PLAN.md — Registry expansion (4 new ToolIds), routing stubs, signature fonts, shared PagePreview component
- [ ] 12-02-PLAN.md — PDF/A conversion + Repair PDF: GS sidecar Rust commands and flow UIs
- [ ] 12-03-PLAN.md — Sign PDF signature creation: canvas drawing, typed text, image upload, persistence
- [ ] 12-04-PLAN.md — Sign PDF placement: drag-and-drop on page preview, resize handles, page range, full flow wiring
- [ ] 12-05-PLAN.md — Redact PDF: rectangle drawing overlay, text search, render-to-image redaction, full flow

### Phase 13: Edit and convert PDF to DOC and Kindle ebook formats

**Goal:** Users can edit PDF text and images in a side-panel editor, and convert documents bidirectionally between PDF and DOCX/DOC/ODT/EPUB/MOBI/AZW3/TXT/RTF — all locally
**Depends on:** Phase 12
**Success Criteria** (what must be TRUE):
  1. User can open a PDF in the Edit PDF tool and see a side-panel editor with thumbnail navigation
  2. User can click on text to edit inline, change font/size/color/alignment, add new text blocks, and delete text
  3. User can insert, move, resize, rotate, flip, replace, and delete images on PDF pages
  4. User can convert/export the current PDF to other formats from within the editor
  5. User can use the standalone Convert Document tool to convert between PDF and DOCX/DOC/ODT/EPUB/MOBI/AZW3/TXT/RTF
  6. User can configure font, margins, and spacing during conversion
  7. EPUB conversion offers reflowable vs fixed-layout choice
**Plans:** 5/5 plans complete

Plans:
- [ ] 13-01-PLAN.md — Foundation: types, format detection, tool registry, Rust sidecar commands (LibreOffice + Calibre)
- [ ] 13-02-PLAN.md — Convert Document tool: full Pick -> Configure -> Compare -> Save flow with format/typography controls
- [ ] 13-03-PLAN.md — Edit PDF shell: editor layout, collapsible thumbnail sidebar, page canvas, text extraction engine, App.tsx routing
- [ ] 13-04-PLAN.md — PDF text editing: text overlay, inline editing, formatting toolbar, overlay+redraw save engine
- [ ] 13-05-PLAN.md — PDF image editing: image extraction, drag/resize/rotate overlays, insert/delete, in-editor Export panel

---

### Phase 14: Security & Privacy Hardening 🔒
**Goal**: The app is safe against all known security vulnerabilities and provides strong, verifiable privacy guarantees to users — no data leaks, no injection vectors, no unsafe file handling
**Depends on**: Phase 13 (all features complete)
**Origin**: Pre-release security audit — closed beta preparation
**Success Criteria** (what must be TRUE):
  1. All shell command invocations are sanitized against injection (especially AppleScript/PowerShell string interpolation in convert_with_word)
  2. All Tauri IPC commands validate arguments server-side (path traversal, format allow-lists, size limits)
  3. Tauri capability scopes are tightened to minimum required permissions
  4. Temp files are reliably cleaned up — no sensitive user data lingers in temp directories
  5. Content Security Policy (CSP) is configured to lock down the webview (no inline scripts, no external connections)
  6. npm and Cargo dependency audit passes with zero known critical/high vulnerabilities
  7. PDF password handling in protect/unlock flows never logs or persists plaintext passwords
  8. A user-facing Privacy Policy / data handling statement is accessible from the app
  9. All security measures are covered by automated tests

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell & File Input | 3/3 | Complete | 2026-02-19 |
| 2. PDF Processing | 3/3 | Complete | 2026-02-20 |
| 3. Image Processing | 3/3 | Complete | 2026-02-21 |
| 4. Polish & Trust | 2/2 | Complete    | 2026-02-23 |
| 5. PDF Real Compression ⚠️ | 3/3 | Complete | 2026-02-24 |
| 6. Safety & Hardening 🟠 | 3/3 | Complete   | 2026-02-25 |
| 7. E2E Test Automation 🟠 | 3/3 | Complete | 2026-02-26 |
| 8. UX Polish & Refinements | 5/5 | Complete | — |
| 9. Dashboard & Multi-Tool | 6/6 | Complete | 2026-03-04 |
| 10. Quick-Win Tools + Compress | 6/6 | Complete | 2026-03-04 |
| 11. P2 Visual PDF Tools | 6/6 | Complete | 2026-03-04 |
| 12. Advanced PDF Tools | 5/5 | Complete   | 2026-03-06 |
| 13. Edit & Convert PDF | 5/5 | Complete | 2026-03-08 |
| 14. Security & Privacy 🔒 | 4/4 | Complete   | 2026-03-15 |
