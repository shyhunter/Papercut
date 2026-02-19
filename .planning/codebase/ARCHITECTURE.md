# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Modular desktop application with document processing pipeline

**Key Characteristics:**
- Tauri-based desktop shell for native cross-platform distribution
- Format-specific processing modules (image, PDF, DOCX) with shared interface
- TypeScript for type safety across front and backend
- Document transformation pipeline: load → resize/reformat → save

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface for file selection, processing options, and output preview
- Location: `src-tauri/src/` (Tauri commands) and React components (location TBD)
- Contains: React components, UI state management, event handlers
- Depends on: Tauri IPC bridge to backend
- Used by: End user; initiates document processing

**IPC Bridge:**
- Purpose: TypeScript-based command interface between Tauri frontend and Rust backend
- Location: `src-tauri/src/commands/` (planned)
- Contains: Command definitions using Tauri's `#[tauri::command]` macros
- Depends on: Processing module exports
- Used by: Presentation layer for async document operations

**Processing Layer (Backend):**
- Purpose: Core document processing logic for each format
- Location: `src-tauri/src/processors/`
- Contains: Format-specific modules (image.rs, pdf.rs, docx.rs)
- Depends on: Sharp (images), pdf-lib (PDF), docx (DOCX)
- Used by: IPC command handlers

**File I/O Layer:**
- Purpose: Safe file read/write operations, temp file management
- Location: `src-tauri/src/io/` (planned)
- Contains: File staging, path validation, cleanup
- Depends on: std::fs, temp_dir utilities
- Used by: Processing modules

## Data Flow

**Document Processing Flow:**

1. User selects file via file picker (UI)
2. Frontend sends file path to backend via `process_document` command
3. Rust backend detects file type from extension
4. Routes to appropriate processor (image/PDF/DOCX)
5. Processor loads document into memory
6. Applies transformations (resize, reformat)
7. Writes result to temp file
8. Returns file path and preview data to frontend
9. User saves or discards result

**State Management:**
- Frontend: React component state for UI selections (output format, dimensions, etc.)
- Backend: Stateless processors; all context passed per request
- Temp files: Managed per-operation in system temp directory; cleaned after save or discard

## Key Abstractions

**ProcessorInterface (Planned):**
- Purpose: Unified trait for all document type processors
- Examples: `ImageProcessor`, `PdfProcessor`, `DocxProcessor`
- Pattern: Trait with `load()`, `resize()`, `reformat()`, `save()` methods

**DocumentConfig:**
- Purpose: Common settings shared across formats (output dimensions, compression level, etc.)
- Pattern: Struct passed to all processors; format-specific fields handled per module

**FormatDetector:**
- Purpose: Determine file type and route to correct processor
- Pattern: Extension-based with optional magic byte validation

## Entry Points

**Desktop App Startup:**
- Location: `src-tauri/src/main.rs`
- Triggers: User launches executable
- Responsibilities: Initialize Tauri window, register IPC commands, start event loop

**File Processing Command:**
- Location: `src-tauri/src/commands/process.rs` (planned)
- Triggers: Frontend calls `process_document(path, config)`
- Responsibilities: Load file, dispatch to format processor, return result

**Tauri Window:**
- Location: React component root (TBD)
- Triggers: Tauri app initialization
- Responsibilities: Render file picker, options form, results display

## Error Handling

**Strategy:** Two-tier error handling

**Frontend Errors:**
- File picker cancellation: Silent; no error shown
- Invalid file type: User-facing modal with suggestion
- Network/IPC timeout: Retry prompt

**Backend Errors:**
- File not found: HTTP-style 404 response
- Unsupported operation (e.g., DOCX crop in v1): Graceful degradation with message
- Out of memory: Fail fast with cleanup; suggest smaller input
- Processing failure: Log full error, return sanitized message to UI

**Patterns:**
- Result<T, ProcessError> for Rust operations
- Custom ProcessError enum with variant for each failure type
- Tauri `invoke_handler` catches panics and converts to IPC errors

## Cross-Cutting Concerns

**Logging:**
- Frontend: console.log (development) or silent (production)
- Backend: println! to stderr during development; structured logging (TBD for production)

**Validation:**
- File type: Extension + optional magic bytes before processing
- Dimensions: UI constraints prevent invalid input; server validates as fail-safe
- File size: Check before loading into memory; reject if exceeds 500MB

**Configuration:**
- Output format: User-selected via UI dropdown
- Processing quality: Default presets (fast, balanced, best); user-selectable
- Temp directory: System default; configurable via environment variable

**Security:**
- No arbitrary command execution; only file I/O allowed
- Input paths validated against whitelist of allowed directories
- Temp files cleaned after operation completes or on app exit

---

*Architecture analysis: 2026-02-19*
