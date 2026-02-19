# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**None currently planned.** Papercut is a local utility application with no external API dependencies. All processing is performed locally on the user's machine.

## Data Storage

**Databases:**
- None - Papercut is a stateless utility app with no persistent data storage

**File Storage:**
- Local filesystem only - All input documents and outputs stored in user-selected directories
- No cloud storage integration planned
- No temporary cache storage (all work is in-memory)

**Caching:**
- None - Stateless processing per document

## Authentication & Identity

**Auth Provider:**
- None required - This is a local utility app with no user accounts or authentication
- No OAuth or identity provider integration

## Monitoring & Observability

**Error Tracking:**
- None currently planned

**Analytics:**
- None - No usage tracking or telemetry

**Logs:**
- Tauri native logging to console (dev mode)
- User-visible error dialogs for operation failures
- No log file persistence planned

## CI/CD & Deployment

**Hosting:**
- None - Distributed as standalone desktop application binaries
- macOS: `.app` bundle (signed and notarized)
- Windows: `.exe` installer (NSIS)
- Linux: AppImage or `.deb` package

**CI Pipeline:**
- GitHub Actions (planned for future)
- Currently: manual builds via Tauri CLI

**Distribution:**
- GitHub Releases (planned) - Direct binary downloads
- No app store distribution planned initially

## Environment Configuration

**Development:**
- No required environment variables
- Configuration via code/build flags only
- Build commands: `tauri build` (production), `tauri dev` (development)

**Production:**
- Standalone binaries with no external dependencies
- Application settings stored locally (document history, preferences)
- No remote configuration or feature flags

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Document Processing Integrations

**Note:** The following are NOT external integrations but internal processing libraries. Documented here for clarity:

- **Sharp** - Local image file processing (JPEG, PNG, WebP, etc.)
  - Operation: Image resizing, format conversion, quality adjustment
  - No external service calls

- **pdf-lib** - Local PDF manipulation
  - Operation: Page extraction, scaling, reformatting
  - No external service calls

- **docx** - Local DOCX document manipulation
  - Operation: Page size changes, restructuring content
  - No external service calls (pure JS library)

---

*Integration audit: 2026-02-19*
*Update when adding/removing external services*
