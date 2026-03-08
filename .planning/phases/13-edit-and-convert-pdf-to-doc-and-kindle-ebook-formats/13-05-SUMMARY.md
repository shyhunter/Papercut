---
phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats
plan: 05
subsystem: pdf-image-editing-and-export
tags: [pdf-lib, pdfjs-dist, image-overlay, drag-resize, export, document-conversion]

# Dependency graph
requires:
  - plan: 13-02
    provides: "documentConverter.ts (convertDocument, getAvailableOutputFormats, checkSidecarAvailability)"
  - plan: 13-03
    provides: "EditorLayout, PageCanvas, ThumbnailSidebar"
provides:
  - "pdfImageExtract.ts: extract images from PDF pages via XObject enumeration + operator list positioning"
  - "ImageOverlay component: draggable, resizable image overlays with aspect-ratio-locked corner handles"
  - "ExportPanel component: in-editor Convert/Export panel reusing documentConverter.ts"
  - "Edit/Export tab toggle in editor right panel"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [XObject enumeration for image extraction, OperatorList for image positioning, offscreen canvas for rotation/flip]

key-files:
  created:
    - src/lib/pdfImageExtract.ts
    - src/components/edit-pdf/ImageOverlay.tsx
    - src/components/edit-pdf/ExportPanel.tsx
  modified:
    - src/components/edit-pdf/EditorLayout.tsx
    - src/components/edit-pdf/EditPdfFlow.tsx
---

## What was built
Image editing and in-editor export capabilities:

1. **pdfImageExtract.ts** (327 lines, committed 8b3432f): Extracts images from PDF pages:
   - Uses pdf-lib XObject enumeration to find Image subtype entries
   - Uses pdfjs-dist OperatorList to find paintImageXObject operators for position data
   - Returns ImageBlock[] with id, position (x/y), dimensions, imageBytes, rotation/flip state

2. **ImageOverlay.tsx** (339 lines, committed 8b3432f): Interactive image overlays:
   - Absolutely-positioned divs with `<img>` elements from Blob URLs
   - Click to select (blue border + resize handles)
   - 8 resize handles (4 corners + 4 midpoints) with aspect-ratio lock
   - Drag to reposition, constrained to page bounds
   - CSS transform for rotation and flip display

3. **ExportPanel.tsx** (320 lines): Compact Convert/Export panel in the editor right panel:
   - Format selector grid (DOCX, DOC, ODT, EPUB, MOBI, AZW3, TXT, RTF)
   - Collapsible typography controls (font family, font size, margins, line spacing)
   - EPUB layout toggle (reflowable/fixed) — only shown for EPUB output
   - Sidecar availability check with install hints
   - Applies pending edits (applyAllEdits) before conversion
   - Save dialog on success with file size display
   - Reuses documentConverter.ts — zero duplication of conversion logic

4. **EditorLayout.tsx** updates: Edit/Export tab toggle in right panel, ImageOverlay rendered as PageCanvas child alongside TextOverlay.

## Decisions
- ExportPanel reuses documentConverter.ts entirely — no conversion logic duplicated
- Tab toggle (Edit | Export) instead of accordion — cleaner UX with clear separation
- Pending edits applied before export via applyAllEdits() so exported files reflect all changes
- Image extraction falls back gracefully if position parsing is incomplete — users can reposition

## Verification
- `npx tsc --noEmit` passes
- ImageOverlay renders with drag/resize handles
- ExportPanel shows format grid with sidecar availability warnings
- Edit/Export tab toggle switches panels correctly
