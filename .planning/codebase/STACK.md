# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript - All application code (React components, Tauri backend, utilities)

**Secondary:**
- JavaScript - Configuration files, build scripts
- Rust - Tauri native bindings (platform-specific code)

## Runtime

**Environment:**
- Node.js 18.x or later (for development and build tooling)
- Tauri runtime (platform-specific native runtime on macOS/Windows/Linux)

**Package Manager:**
- npm 9.x or later
- Lockfile: `package-lock.json` (when created)

## Frameworks

**Core:**
- Tauri 1.x or 2.x - Desktop app shell (cross-platform native binary)
- React 18.x or later - UI framework for frontend
- TypeScript 5.x - Type safety and development experience

**Build/Dev:**
- Vite - Frontend bundler and dev server (configured by Tauri)
- Tauri CLI - Desktop app build and packaging

## Key Dependencies

**Critical:**
- sharp - High-performance image resizing and compression (dependency: P002)
- pdf-lib - PDF page resizing and reformatting without binary dependencies (dependency: P003)
- docx - Word document (.docx) manipulation and reformatting (dependency: P004)

**Infrastructure:**
- @tauri-apps/api - Tauri API bindings for backend communication
- @tauri-apps/wry - WebView rendering engine (used by Tauri)

## Configuration

**Environment:**
- No environment variables required for core functionality
- Development mode controlled by Tauri build flags
- Configuration via CLI/UI only (no .env files needed)

**Build:**
- `tauri.conf.json` - Tauri app configuration (icon, window size, bundle settings)
- `tsconfig.json` - TypeScript compiler options
- `vite.config.ts` - Vite bundler configuration
- `package.json` - Dependency specifications

## Platform Requirements

**Development:**
- macOS (10.13+), Windows (7+), or Linux (any modern distro)
- Node.js 18.x LTS or later installed
- Rust toolchain (automatically installed by Tauri on first build)
- Native build tools (Xcode on macOS, MSVC on Windows)

**Production:**
- Standalone distributable native binary (macOS .app, Windows .exe, Linux AppImage)
- No runtime dependencies required on target machine
- Final bundle size target: ~10MB (lightweight vs Electron's 150MB+)
- Auto-update capability via Tauri updater

---

*Stack analysis: 2026-02-19*
*Update after major dependency changes*
