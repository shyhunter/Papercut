# Papercut

## What This Is

Papercut is a local desktop app for compressing, resizing, and converting PDF and image files. It is the privacy-first alternative to online tools like ILovePDF and Smallpdf — everything is processed on the user's machine, never uploaded to any server. Built for anyone who needs to shrink a document to fit an upload form (a CV, ID scan, official form) without handing their personal files to a website they don't know or trust.

## Core Value

Users can reduce, resize, and convert documents locally in seconds — zero uploads, zero privacy compromise, zero frustration with confusing web UIs.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**File Processing — PDF:**
- [ ] User can open a PDF file via file picker or drag-and-drop
- [ ] User can compress a PDF to a target file size (e.g. "under 2MB")
- [ ] User can resize PDF page dimensions (e.g. A4 → Letter, or custom)
- [ ] User can see before/after file size comparison before saving
- [ ] User can save the processed PDF to a chosen local path

**File Processing — Images:**
- [ ] User can open an image file (JPG, PNG, WebP) via file picker or drag-and-drop
- [ ] User can adjust compression quality (e.g. slider 10%–100%)
- [ ] User can resize image dimensions (width × height, with aspect ratio lock)
- [ ] User can convert image format (JPG ↔ PNG ↔ WebP)
- [ ] User can see side-by-side comparison (original vs result) before saving
- [ ] User can save the processed image to a chosen local path

**UX & Navigation:**
- [ ] App shows a progress indicator highlighting the current step (Pick → Configure → Compare → Save)
- [ ] App remembers recently used file directories and offers them as quick-access shortcuts
- [ ] User can switch between color themes (background and button color patterns)
- [ ] App has micro-animations on key interactions (file drop, processing completion, save confirmation)

**Privacy & Trust:**
- [ ] No file data is ever sent to any external server or service
- [ ] No telemetry, analytics, or crash reporting that transmits user data

### Out of Scope

- DOCX manipulation — deferred to v2 (library chosen, complexity of page sizing non-trivial)
- Batch processing (multiple files at once) — deferred to v2 (UX complexity)
- Cloud storage integration — contradicts privacy-first core value
- Mobile version — desktop-first (Tauri)
- PDF → DOCX conversion — too complex, out of scope entirely

## Context

- The primary use case is "I have a file that's too large for an upload form, I need to shrink it quickly and privately." Users are not document power-users — they want speed and clarity over advanced controls.
- The codebase architecture is fully planned (`.planning/codebase/`) but no application source code has been written yet. This is a greenfield build.
- The target feel is: friendly, calm, slightly playful (micro-animations, color themes) — not a sterile utility app.
- Competing tools (web): ILovePDF, Smallpdf, Squoosh. Differentiator: 100% local, native speed, polished UX.

## Constraints

- **Tech Stack**: Tauri + TypeScript + React — locked (P001)
- **Image Processing**: Sharp library — locked (P002)
- **PDF Processing**: pdf-lib library — locked (P003)
- **DOCX Processing**: docx library — available but DOCX features are v2 (P006)
- **Privacy**: No network calls for file processing. Ever.
- **Bundle Size**: Target ~10MB distributable (Tauri vs Electron advantage)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PDF and images in v1, DOCX in v2 | DOCX page sizing is non-trivial; PDF+image covers the primary use case | — Pending |
| Side-by-side comparison before save | User explicitly asked for ability to see what they're trading off | — Pending |
| Progress indicator (not wizard) | User wants all steps visible at once, current step highlighted | — Pending |
| Path memory for recent directories | Saves repeated navigation for users who keep files in same folders | — Pending |
| Color theme customization | User wants ability to change background/button color patterns | — Pending |
| Micro-animations | Delight feature — file drop, processing complete, save confirmation | — Pending |

---
*Last updated: 2026-02-19 after initialization*
