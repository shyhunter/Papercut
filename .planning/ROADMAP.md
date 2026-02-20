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
- [ ] **Phase 3: Image Processing** - Compress, resize, convert, and compare images before saving
- [ ] **Phase 4: Polish & Trust** - Recent directory shortcuts and privacy verification

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
- [ ] 01-03-PLAN.md — StepBar component (Pick → Configure → Compare → Save) and App.tsx integration

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
**Plans**: TBD

Plans:
- [ ] 03-01: Image processing engine (Sharp integration: compress, resize, convert)
- [ ] 03-02: Image configuration UI (quality slider, dimensions, format picker)
- [ ] 03-03: Side-by-side comparison view

### Phase 4: Polish & Trust
**Goal**: The app feels complete and trustworthy -- quick access to recent folders and verified zero-network-call operation
**Depends on**: Phase 3
**Requirements**: FINP-03, UX-03
**Success Criteria** (what must be TRUE):
  1. App remembers recently used directories and offers them as shortcuts when opening the file picker
  2. No file data is ever sent to any external server (verified: no outbound network calls during any processing operation)
  3. App handles edge cases gracefully (unsupported file types, corrupted files, cancelled operations) without crashing
**Plans**: TBD

Plans:
- [ ] 04-01: Recent directories persistence and quick-access UI
- [ ] 04-02: Privacy verification and edge-case hardening

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell & File Input | 3/3 | Complete   | 2026-02-19 |
| 2. PDF Processing | 3/3 | Complete   | 2026-02-20 |
| 3. Image Processing | 0/3 | Not started | - |
| 4. Polish & Trust | 0/2 | Not started | - |
