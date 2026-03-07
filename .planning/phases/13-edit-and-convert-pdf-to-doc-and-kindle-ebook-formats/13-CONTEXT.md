# Phase 13: Edit and Convert PDF to DOC and Kindle Ebook Formats - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new dashboard tools: (1) **Edit PDF** — a side-panel PDF editor for text and image editing with built-in export/convert, and (2) **Convert Document** — a standalone format conversion tool supporting bidirectional conversion between PDF and DOCX/DOC/ODT/EPUB/MOBI/AZW3/TXT/RTF. All processing remains local.

</domain>

<decisions>
## Implementation Decisions

### Conversion Targets
- **Document formats:** DOCX, DOC, ODT
- **Ebook formats:** EPUB (all versions — EPUB 2 + EPUB 3), MOBI, AZW3
- **Additional input formats:** TXT, RTF (for conversion to PDF)
- **Direction:** Bidirectional — PDF-to-X and X-to-PDF
- Full format matrix: PDF <-> DOCX, DOC, ODT, EPUB, MOBI, AZW3, TXT, RTF

### Fidelity Expectations
- **PDF-to-DOCX goal:** Maximum fidelity — preserve visual layout AND keep content editable (not one or the other)
- **Images and tables:** Extract at original resolution and embed in output; recreate tables as native tables
- **PDF-to-EPUB:** User chooses between reflowable (proper ebook reflow) and fixed-layout (preserves exact page appearance) per conversion
- **Fonts:** Embed original fonts in output by default
- **User controls exposed during conversion:**
  - Font family and size selection
  - Page margins adjustment
  - Line spacing / paragraph distance

### PDF Editing Scope — Text
- Full text editing: click on any text to edit inline
- Change font, size, color, alignment
- Replace text content
- Add new text blocks anywhere on a page
- Delete text

### PDF Editing Scope — Images
- Insert image (from file, position on page)
- Replace existing image with a new file
- Resize image (drag handles, aspect ratio lock)
- Move/reposition image (drag to new position)
- Delete image
- Rotate image (90/180/270) and flip (horizontal/vertical)

### Tool UX Flow
- **Dashboard:** Two new tools:
  1. **"Edit PDF"** — opens full PDF editor; includes text editing, image editing, AND convert/export as a feature within the editor
  2. **"Convert Document"** — standalone quick-access card for format conversion without the full editor
- **Edit PDF layout:** Side panel editor — PDF preview on one side, editing controls panel on the other (consistent with Papercut's existing configure/compare pattern)
- **Edit PDF navigation:** Collapsible thumbnail sidebar on the left + previous/next page arrows with page number input
- **Convert Document flow:** Full step flow — Pick -> Configure (format, font, margins, spacing) -> Compare -> Save

### Claude's Discretion
- Editor toolbar design and icon choices
- Text selection and inline editing interaction patterns
- How to render editable text overlays on top of PDF pages
- Conversion engine selection (library/tool choices)
- Thumbnail sidebar collapse behavior and animation
- How to handle unsupported PDF features during editing (e.g., form fields, annotations)
- Error handling for conversion failures

</decisions>

<specifics>
## Specific Ideas

- Edit PDF tool should also contain a "Convert/Export" option — so users who open the editor can also export to other formats without going back to dashboard
- Convert Document tool is for users who just want quick format conversion without entering the full editor
- The user envisions Papercut growing toward a full PDF editor like Adobe Acrobat — this phase covers the core editing and conversion foundation
- Font embedding + user font/size/margin/spacing controls make the converter feel like a proper document preparation tool, not just a raw converter

</specifics>

<deferred>
## Deferred Ideas

The user provided a comprehensive feature map of professional PDF editors. The following capabilities are explicitly deferred to future phases:

- **Forms** — Form field creation (text, checkbox, radio, dropdown), form logic, validation, calculations, data import/export
- **OCR** — Scanned document to searchable/editable text, language detection, layout recognition
- **Annotations/Markup** — Highlight, underline, strikethrough, sticky notes, drawing tools, shapes, arrows
- **Document Comparison** — Version comparison, highlight differences, side-by-side, change summary
- **Batch Processing** — Batch watermark, batch conversion, batch renaming, batch compression
- **Image Advanced Editing** — Layering (bring to front/back, grouping), formatting (brightness, contrast, transparency, opacity), masking, bulk replacement, advanced cropping (masks, non-destructive)
- **Bookmarks/Links** — Create/edit bookmarks, internal/external links, page navigation links
- **Accessibility** — Tagging structure, reading order, alt text, screen reader compatibility
- **Metadata Editing** — Title, author, keywords, XMP metadata
- **Attachments** — Embed files, manage attachments
- **Collaboration/Cloud** — Shared reviews, comment sync, document sharing, cloud storage integration
- **Alignment Tools** — Snap to grid, guides, precise X/Y positioning, distribute objects evenly
- **Image Extraction** — Export images from PDF as separate files

</deferred>

---

*Phase: 13-edit-and-convert-pdf-to-doc-and-kindle-ebook-formats*
*Context gathered: 2026-03-07*
