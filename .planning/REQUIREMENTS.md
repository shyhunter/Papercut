# Requirements: Papercut

**Defined:** 2026-02-19
**Core Value:** Users can reduce, resize, and convert documents locally in seconds — zero uploads, zero privacy compromise.

## v1 Requirements

### File Input

- [ ] **FINP-01**: User can open a PDF or image file via a file picker dialog
- [ ] **FINP-02**: User can open a file by dragging and dropping it onto the app window
- [ ] **FINP-03**: App remembers recently used directories and offers them as shortcuts in the file picker

### PDF Processing

- [ ] **PDF-01**: User can compress a PDF to a specified target file size (e.g. "under 2MB")
- [ ] **PDF-02**: User can resize PDF page dimensions (preset sizes: A4, A3, Letter; or custom width × height)
- [ ] **PDF-03**: User sees estimated output file size before committing to save

### Image Processing

- [ ] **IMG-01**: User can adjust image compression quality via a slider (1–100%)
- [ ] **IMG-02**: User can resize image dimensions (width × height) with an aspect ratio lock toggle
- [ ] **IMG-03**: User can convert image output format (JPG ↔ PNG ↔ WebP)
- [ ] **IMG-04**: User can see a side-by-side comparison of original vs processed result before saving

### UX & Output

- [ ] **UX-01**: App shows a step progress indicator highlighting the current step (Pick → Configure → Compare → Save)
- [ ] **UX-02**: User can save the processed file to a chosen local path (Save As dialog)
- [ ] **UX-03**: No file data is ever sent to any external server or service (verified: no outbound network calls for processing)

## v2 Requirements

### Personalization

- **PERS-01**: User can select a color theme (background and button color patterns)
- **PERS-02**: App has micro-animations on key interactions (file drop, processing complete, save confirmation)

### DOCX Processing

- **DOCX-01**: User can resize DOCX page dimensions
- **DOCX-02**: User can compress embedded images within a DOCX file

### Batch Processing

- **BATCH-01**: User can process multiple files of the same type in one operation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud storage integration | Contradicts privacy-first core value |
| PDF → DOCX conversion | High complexity, low value vs complexity ratio |
| Mobile version | Desktop-first (Tauri); mobile is a separate product decision |
| Telemetry / crash reporting | Privacy constraint — no data leaves the machine |
| Plugin system / extensibility | Premature generalization for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FINP-01 | — | Pending |
| FINP-02 | — | Pending |
| FINP-03 | — | Pending |
| PDF-01 | — | Pending |
| PDF-02 | — | Pending |
| PDF-03 | — | Pending |
| IMG-01 | — | Pending |
| IMG-02 | — | Pending |
| IMG-03 | — | Pending |
| IMG-04 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: 13 ⚠️

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after initial definition*
