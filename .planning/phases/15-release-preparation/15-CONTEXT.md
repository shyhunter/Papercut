# Phase 15: Release Preparation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Prepare Papercut for closed beta release — build pipeline for all platforms, distribution via GitHub Releases, branding & UI polish, CI/CD automation, in-app feedback collection, GitHub repo setup, and monetization strategy documentation. Landing page and marketing execution are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Build & Packaging
- Target all 4 platforms: macOS Apple Silicon, macOS Intel, Windows x64, Linux (AppImage/deb)
- No code signing for beta — testers bypass Gatekeeper manually
- Auto-update via Tauri updater as default, with manual download from GitHub Releases as fallback for version pinning/rollback
- Don't bundle external dependencies (Ghostscript, LibreOffice, Calibre) — app uses whatever tools the user has installed (leverages the detect_converters system from Phase 14)

### Distribution
- Primary: GitHub Releases for download artifacts
- Secondary: GitHub Pages landing page (deferred to separate phase)
- Repo stays private during beta, public after stable release
- Open access — no invite codes, anyone with the link can download

### Branding & UI Polish
- App icon needs to be created — scissors/paper theme, clean and modern
- Version numbering: `1.0.0-beta.1` (signals this IS the v1, just needs testing)
- Splash screen: brief logo display on launch (1-2 seconds)
- UI improvements for release:
  - Dark mode refinement across all tools
  - Dashboard layout polish (spacing, hover effects, categories)
  - Loading/progress states (better spinners, progress bars, skeletons)
  - About dialog (version, credits, links, license)
  - Button design consistency
  - Responsive design improvements
  - Info sharing capabilities
  - Delight features (success animations, micro-interactions)

### CI/CD Pipeline
- CI on every push/PR: TypeScript type check, Vitest unit tests, Cargo check/clippy, full Tauri build for all 4 platforms
- E2E tests (WebDriverIO) run on every PR
- Release triggers: git tag for stable releases + manual dispatch for ad-hoc builds
- Existing `release.yml` workflow provides a starting point

### Testing & Feedback
- Start with 5-10 colleagues as beta testers
- In-app feedback button that creates GitHub Issues via API
- Opt-in crash reports (zero tracking by default, user chooses to send crash data)
- After Phase 15, circle back to Phase 7 to expand E2E test coverage

### Monetization (Plan Only — Implementation Deferred)
- Model: One-time purchase (no subscription)
- Free vs paid tier split: decide after beta feedback
- Pricing: decide after beta feedback
- Payment provider: decide later
- License key validation: Claude's discretion on architecture readiness

### GitHub Repository
- Full README with hero screenshot, features list, install instructions, privacy section
- MIT license
- Issue templates (bug report + feature request) and PR template with checklist
- Auto-generated CHANGELOG.md from commit messages / PR titles

### Claude's Discretion
- Exact splash screen implementation and duration
- Icon design details (will create a scissors/paper themed icon)
- License key architecture planning (whether to pre-wire hooks)
- Payment provider recommendation when the time comes
- CI pipeline optimizations (caching, parallelization)
- Crash report implementation approach (privacy-respecting)

</decisions>

<specifics>
## Specific Ideas

- Auto-update + manual download fallback is the standard pattern (like VS Code) — users can pin to stable versions
- In-app feedback should pre-fill system info (OS, app version, available converters)
- Privacy promise must remain intact — opt-in crash reports only, never default-on telemetry
- Marketing channels for launch: Product Hunt, Reddit (r/selfhosted, r/privacy, r/mac), Hacker News, Twitter/X

</specifics>

<deferred>
## Deferred Ideas

- Landing page / website — separate phase (GitHub Pages site with hero, features, download)
- Marketing execution — manual effort by user, not automated in this phase
- Monetization implementation — separate phase after beta validates demand
- Mac App Store / Homebrew distribution — future consideration
- After Phase 15, return to Phase 7 to expand E2E test coverage

</deferred>

---

*Phase: 15-release-preparation*
*Context gathered: 2026-03-15*
