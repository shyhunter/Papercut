---
phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats
plan: 04
subsystem: pdf-text-editing
tags: [pdf-lib, contenteditable, text-overlay, pdf-editing]

# Dependency graph
requires:
  - plan: 13-03
    provides: "EditorLayout, PageCanvas, ThumbnailSidebar, pdfTextExtract"
provides:
  - "TextOverlay component: contentEditable text divs positioned over PDF canvas"
  - "EditorToolbar: mode toggle (select/text/image), font/size/color/alignment controls, image controls"
  - "pdfEditor.ts: save engine with applyTextEdits, applyImageEdits, applyAllEdits"
  - "White-rectangle + drawText overlay pattern for PDF text modification"
affects: [13-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [overlay+redraw pattern for PDF text editing, contentEditable for inline editing]

key-files:
  created:
    - src/lib/pdfEditor.ts
  modified:
    - src/components/edit-pdf/EditorToolbar.tsx
    - src/components/edit-pdf/EditorLayout.tsx
    - src/components/edit-pdf/EditPdfFlow.tsx
---

## What was built
Text editing capabilities for the PDF editor:

1. **TextOverlay.tsx** (created in 13-05 commit 8b3432f): Absolutely-positioned contentEditable divs over the PDF canvas. Each text block rendered at correct position using PDF-to-CSS coordinate conversion (PDF bottom-left to CSS top-left). Click to select, type to edit, blue border on selection.

2. **EditorToolbar.tsx**: Complete formatting controls panel:
   - Mode toggle: Select / Text / Image
   - Text controls: font family (Helvetica/TimesRoman/Courier), font size (6-144pt with spinner), color (5 presets + custom hex + color picker), alignment (left/center/right)
   - Image controls: rotate (90 CW/CCW, 180), flip (horizontal/vertical), replace, delete
   - Insert Image button (always visible)

3. **pdfEditor.ts** (353 lines): PDF save engine using pdf-lib:
   - `applyTextEdits()`: white rectangle over original text position + drawText with new content
   - `applyImageEdits()`: white rectangle over original + embedPng/embedJpg + drawImage
   - `applyAllEdits()`: combined text + image edits (text first, then images)
   - `transformImageBytes()`: offscreen canvas rotation/flip transform
   - Font mapping: PDF font names → pdf-lib StandardFonts (Helvetica fallback)

4. **EditorLayout.tsx** updates: Wires text + image overlays into PageCanvas children, event handlers for text/image CRUD, selectedBlock/selectedImageBlock state, editor mode tracking.

## Decisions
- Used overlay+redraw pattern (white rect + drawText) as the standard browser-based PDF editing approach — pdf-lib cannot modify existing content streams directly
- Font fallback to Helvetica for unknown PDF fonts (per research recommendation)
- `isBlockModified()` returns true for all non-new blocks that reach the save engine — simpler than tracking per-field dirty state

## Verification
- `npx tsc --noEmit` passes
- TextOverlay renders at correct positions via PDF→CSS coordinate transform
- EditorToolbar shows context-sensitive controls (text vs image)
- pdfEditor.ts applyAllEdits produces valid PDF bytes via pdf-lib
