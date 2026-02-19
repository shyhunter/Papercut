# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
papercut/
├── src-tauri/
│   ├── Cargo.toml            # Rust dependencies and Tauri configuration
│   ├── src/
│   │   ├── main.rs           # Tauri app entry point, window setup
│   │   ├── commands/         # IPC command handlers
│   │   ├── processors/       # Format-specific document processing
│   │   │   ├── mod.rs
│   │   │   ├── image.rs
│   │   │   ├── pdf.rs
│   │   │   └── docx.rs
│   │   ├── io/               # File I/O utilities
│   │   │   ├── mod.rs
│   │   │   ├── staging.rs
│   │   │   └── cleanup.rs
│   │   └── error.rs          # ProcessError enum and error handling
│   └── tauri.conf.json       # Tauri app configuration (window size, permissions, etc.)
├── src/                      # Frontend React TypeScript
│   ├── App.tsx               # Root component
│   ├── components/
│   │   ├── FilePicker.tsx
│   │   ├── ProcessingForm.tsx
│   │   ├── ResultsDisplay.tsx
│   │   └── OptionsPanel.tsx
│   ├── hooks/
│   │   ├── useFileProcessing.ts     # Tauri IPC calls
│   │   └── useDocumentState.ts      # UI state management
│   ├── types/
│   │   └── document.ts              # Shared TS types
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx              # React entry point
├── package.json              # Node dependencies (React, Tauri CLI, etc.)
├── package-lock.json
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── index.html                # HTML entry point for Tauri window
├── README.md
└── .planning/
    └── codebase/             # GSD analysis documents
        ├── ARCHITECTURE.md
        └── STRUCTURE.md
```

## Directory Purposes

**`src-tauri/`:**
- Purpose: Rust backend for Tauri desktop app
- Contains: Compiled binary, processing logic, system integrations
- Key files: `Cargo.toml` (dependencies), `src/main.rs` (app setup), `tauri.conf.json` (permissions, window config)

**`src-tauri/src/commands/`:**
- Purpose: Tauri command handlers that bridge UI to processing logic
- Contains: IPC command definitions for file processing, status queries
- Key files: `process.rs` (main document processing command), `info.rs` (app metadata)

**`src-tauri/src/processors/`:**
- Purpose: Format-specific document transformation logic
- Contains: Image, PDF, and DOCX processors with resize/reformat capabilities
- Key files: `image.rs` (Sharp wrapper), `pdf.rs` (pdf-lib wrapper), `docx.rs` (docx library wrapper)

**`src-tauri/src/io/`:**
- Purpose: File operations and temporary file management
- Contains: Staging area for uploads, cleanup routines, validation
- Key files: `staging.rs` (read/write temp files), `cleanup.rs` (garbage collection on exit)

**`src/`:**
- Purpose: Frontend React TypeScript application
- Contains: UI components, hooks, type definitions, styling
- Key files: `App.tsx` (root), `main.tsx` (React mount)

**`src/components/`:**
- Purpose: Reusable React UI components
- Contains: File picker, processing form, results display, options panel
- Key files: Each component is a `.tsx` file with its own styles

**`src/hooks/`:**
- Purpose: Custom React hooks for backend integration and state
- Contains: Tauri IPC calls, document state management
- Key files: `useFileProcessing.ts` (async processing), `useDocumentState.ts` (UI state)

**`src/types/`:**
- Purpose: Shared TypeScript type definitions
- Contains: Document config, processing result, error types
- Key files: `document.ts` (all shared interfaces)

## Key File Locations

**Entry Points:**
- `src-tauri/src/main.rs`: Rust app initialization, Tauri window setup
- `src/main.tsx`: React app mount point
- `index.html`: HTML wrapper loaded by Tauri window

**Configuration:**
- `Cargo.toml`: Rust dependencies (sharp, pdf-lib, docx), Tauri settings
- `package.json`: Node dependencies (React, TypeScript, Tauri CLI)
- `tsconfig.json`: TypeScript compiler options
- `vite.config.ts`: Frontend build tool configuration
- `tauri.conf.json`: Tauri window size, menu, file system permissions

**Core Logic:**
- `src-tauri/src/processors/`: All document transformation code
- `src-tauri/src/commands/process.rs`: Main IPC entry point
- `src/hooks/useFileProcessing.ts`: Frontend-to-backend communication

**Testing:**
- Test files co-located with source: `src-tauri/src/processors/image.rs.tests` (TBD)
- Frontend tests: `src/**/*.test.tsx` (TBD)

## Naming Conventions

**Files:**
- Rust modules: `snake_case.rs` (e.g., `image.rs`, `error.rs`)
- React components: `PascalCase.tsx` (e.g., `FilePicker.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useFileProcessing.ts`)
- Types: `camelCase.ts` or grouped in `types/` directory

**Directories:**
- Feature/concern grouping: `snake_case` (e.g., `processors/`, `commands/`)
- Component collections: `components/` (plural)

**Rust Structs/Functions:**
- Struct names: `PascalCase` (e.g., `ImageProcessor`, `ProcessError`)
- Function names: `snake_case` (e.g., `process_document()`)
- Error variants: `PascalCase` (e.g., `FileNotFound`, `UnsupportedFormat`)

**React/TypeScript:**
- Component names: `PascalCase` (e.g., `FilePicker`)
- Functions: `camelCase` (e.g., `handleFileSelect()`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Types/Interfaces: `PascalCase` with `Type` or `Config` suffix (e.g., `DocumentConfig`, `ProcessResult`)

## Where to Add New Code

**New Document Format (e.g., PNG, HEIC):**
- Image: Extend `src-tauri/src/processors/image.rs` with format-specific logic
- Add new variant to `FileFormat` enum in `src/types/document.ts`
- Update format detection in `src-tauri/src/commands/process.rs`

**New Processing Option (e.g., rotation, compression):**
- Backend: Add method to relevant processor (e.g., `rotate()` to `ImageProcessor`)
- IPC: Extend `ProcessConfig` struct in `src-tauri/src/` to include new option
- Frontend: Add UI control to `src/components/OptionsPanel.tsx`
- Hook: Update `useFileProcessing.ts` to pass new option to backend

**New UI Feature (e.g., batch processing):**
- Components: Add new `.tsx` file to `src/components/`
- State: Extend `useDocumentState.ts` or create new hook
- IPC: If backend changes needed, add new command to `src-tauri/src/commands/`
- Types: Add interfaces to `src/types/document.ts`

**Utilities/Shared Helpers:**
- Rust: Create new file in `src-tauri/src/` (e.g., `src-tauri/src/validation.rs`)
- TypeScript: Create in `src/` root or `src/utils/` if significant volume
- Tests: Co-locate with implementation

## Special Directories

**`src-tauri/target/`:**
- Purpose: Cargo build output
- Generated: Yes
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Node package dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**`src-tauri/src-tauri.conf.json`:**
- Purpose: Tauri-specific configuration for window, menu, permissions
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: Bundled frontend assets (after Vite build)
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-19*
