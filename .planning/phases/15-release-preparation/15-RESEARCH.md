# Phase 15: Release Preparation — Research

**Researched:** 2026-03-15
**Domain:** Build pipeline, distribution, branding, CI/CD, feedback, repository setup (Tauri v2 desktop app)
**Confidence:** HIGH (well-trodden territory — Tauri v2 build/release is established, existing workflow provides foundation)

## Summary

Phase 15 transforms Papercut from a development project into a distributable closed-beta product. The codebase is mature — 21 tools across PDF, image, and document categories, full dark/light theme support, privacy UI, E2E test infrastructure (WebDriverIO + tauri-wd), and an existing `release.yml` GitHub Actions workflow that already builds for macOS ARM64, macOS Intel, and Windows x64.

The key work areas are: (1) adding Linux builds to the existing workflow, (2) adding a CI workflow for PR/push validation, (3) implementing Tauri v2 updater for auto-updates, (4) UI polish and branding (icon, splash screen, About dialog, micro-interactions), (5) in-app feedback mechanism, (6) GitHub repository setup (README, templates, license), (7) version bump to `1.0.0-beta.1`, and (8) monetization strategy documentation.

**Primary recommendation:** Build incrementally on the existing `release.yml` workflow and Tauri v2 infrastructure. The biggest new integrations are `tauri-plugin-updater` for auto-updates and the in-app feedback system (GitHub Issues API). UI polish is the largest volume of work but is low-risk.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Build & Packaging:**
- Target all 4 platforms: macOS Apple Silicon, macOS Intel, Windows x64, Linux (AppImage/deb)
- No code signing for beta — testers bypass Gatekeeper manually
- Auto-update via Tauri updater as default, with manual download from GitHub Releases as fallback for version pinning/rollback
- Don't bundle external dependencies (Ghostscript, LibreOffice, Calibre) — app uses whatever tools the user has installed (leverages the detect_converters system from Phase 14)

**Distribution:**
- Primary: GitHub Releases for download artifacts
- Secondary: GitHub Pages landing page (deferred to separate phase)
- Repo stays private during beta, public after stable release
- Open access — no invite codes, anyone with the link can download

**Branding & UI Polish:**
- App icon needs to be created — scissors/paper theme, clean and modern
- Version numbering: `1.0.0-beta.1` (signals this IS the v1, just needs testing)
- Splash screen: brief logo display on launch (1-2 seconds)
- UI improvements: dark mode refinement, dashboard layout polish, loading/progress states, About dialog, button consistency, responsive design, info sharing, delight features

**CI/CD Pipeline:**
- CI on every push/PR: TypeScript type check, Vitest unit tests, Cargo check/clippy, full Tauri build for all 4 platforms
- E2E tests (WebDriverIO) run on every PR
- Release triggers: git tag for stable releases + manual dispatch for ad-hoc builds
- Existing `release.yml` workflow provides a starting point

**Testing & Feedback:**
- Start with 5-10 colleagues as beta testers
- In-app feedback button that creates GitHub Issues via API
- Opt-in crash reports (zero tracking by default, user chooses to send crash data)
- After Phase 15, circle back to Phase 7 to expand E2E test coverage

**Monetization (Plan Only):**
- Model: One-time purchase (no subscription)
- Free vs paid tier split: decide after beta feedback
- Pricing: decide after beta feedback
- Payment provider: decide later
- License key validation: Claude's discretion on architecture readiness

**GitHub Repository:**
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

### Deferred Ideas (OUT OF SCOPE)

- Landing page / website — separate phase (GitHub Pages site)
- Marketing execution — manual effort by user
- Monetization implementation — separate phase after beta validates demand
- Mac App Store / Homebrew distribution — future consideration
- After Phase 15, return to Phase 7 to expand E2E test coverage

</user_constraints>

## Current State of the Codebase

### What Already Exists

| Area | Current State | Gap for Beta |
|------|--------------|--------------|
| **Release workflow** | `release.yml` — builds macOS ARM, macOS Intel, Windows via `tauri-apps/tauri-action@v0` | Missing Linux target, missing CI-on-push workflow |
| **Version** | `0.1.0` in `tauri.conf.json`, `package.json`, `Cargo.toml` | Needs bump to `1.0.0-beta.1` |
| **Icons** | Default Tauri icons in `src-tauri/icons/` (all sizes present) | Need custom scissors/paper themed icon |
| **Theme** | Full light/dark/system toggle via `useTheme` hook + CSS vars in `globals.css` | Needs refinement pass (specific areas TBD) |
| **Dashboard** | Grid layout with search, categories, quick actions, drag-drop tool picker | Needs spacing/hover polish |
| **E2E tests** | WebDriverIO + tauri-wd, 2 test files (`pdf-flows.test.ts`, `image-flows.test.ts`) | Need CI integration |
| **Privacy** | `PrivacyFooter`, `PrivacyModal`, `FirstLaunchBanner`, zero-telemetry architecture | Solid — needs About dialog addition |
| **GS sidecar** | Bundled as sidecar in `src-tauri/binaries/gs-*` | Context says "don't bundle" — **conflict to resolve** |
| **README** | Boilerplate Tauri template README | Needs complete rewrite |
| **License** | None | Need MIT license file |
| **CHANGELOG** | None | Need auto-generated CHANGELOG |
| **Updater** | Not configured — no `tauri-plugin-updater` dependency | Full implementation needed |

### Critical Conflict: Ghostscript Bundling

The CONTEXT.md says "Don't bundle external dependencies (Ghostscript, LibreOffice, Calibre) — app uses whatever tools the user has installed." However, the current codebase bundles GS as a sidecar (`src-tauri/binaries/gs-*`, `externalBin` in `tauri.conf.json`). Multiple Rust commands use `.sidecar("gs")`.

**Resolution needed:** The detect_converters system from Phase 14 should handle GS detection. The release workflow and `tauri.conf.json` need updating to remove GS sidecar bundling, and Rust code needs a fallback path to use system-installed GS instead of sidecar GS. This is a significant refactor that should be a dedicated task.

## Standard Stack

### Core (Already in Project)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@tauri-apps/cli` | v2 | Build tooling | Installed |
| `tauri` (Rust) | v2 | App framework | Installed |
| `tauri-apps/tauri-action` | v0 | GitHub Actions build/release | In `release.yml` |
| Vitest | v4.0.18 | Unit testing | Installed |
| WebDriverIO | v9.24.0 | E2E testing | Installed |
| `@crabnebula/tauri-driver` | v2.0.9 | Tauri WebDriver bridge | Installed |

### New Dependencies Needed

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `tauri-plugin-updater` | v2 (Rust) | Auto-update support | Tauri v2 official updater plugin |
| `@tauri-apps/plugin-updater` | v2 (JS) | Frontend update UI | JS bindings for updater |
| `tauri-plugin-process` | v2 (Rust) | App restart after update | Required by updater for `relaunch()` |
| `@tauri-apps/plugin-process` | v2 (JS) | JS bindings for process | For `relaunch()` call |

### CI/CD Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `actions/checkout@v4` | Repo checkout | Already used |
| `actions/setup-node@v4` | Node.js setup | Already used |
| `dtolnay/rust-toolchain@stable` | Rust setup | Already used |
| `swatinem/rust-cache@v2` | Rust build caching | Already used |
| `tauri-apps/tauri-action@v0` | Tauri build + release | Already used — add Linux matrix entry |

### Alternatives Considered

None — the stack is locked by user decisions and existing infrastructure. Tauri v2's official plugins are the only viable options for their respective features.

## Architecture Patterns

### Pattern 1: Tauri v2 Updater Integration

**What:** Use `tauri-plugin-updater` to check for and install updates from GitHub Releases.

**Configuration in `tauri.conf.json`:**
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/OWNER/REPO/releases/latest/download/latest.json"
      ],
      "pubkey": ""
    }
  }
}
```

**Note on signing:** Even without code signing, Tauri updater requires update signature keys. These are generated with `tauri signer generate -w ~/.tauri/mykey`. The private key signs update artifacts; the public key is embedded in the app config. This is NOT macOS code signing — it's Tauri's own update verification.

**Frontend check pattern:**
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update?.available) {
  await update.downloadAndInstall();
  await relaunch();
}
```

**Confidence:** HIGH — this is Tauri v2's documented approach.

### Pattern 2: In-App Feedback via GitHub Issues API

**What:** A feedback button that creates GitHub Issues with pre-filled system info.

**Approach options:**
1. **Direct GitHub API** — User provides a GitHub PAT or the app ships with a scoped token
2. **GitHub Issue URL template** — Open browser with pre-filled issue body (no auth needed)
3. **Tauri HTTP plugin** — POST to GitHub API from the app

**Recommended: Option 2 (URL template)** — Zero auth required. Opens the user's browser to `https://github.com/OWNER/REPO/issues/new?template=feedback.yml&body=...` with system info pre-filled. Works even when repo is private (testers with access can see it). Falls back gracefully if user isn't logged in.

**System info to collect:**
```typescript
const info = {
  appVersion: await getVersion(),
  os: navigator.platform,
  converters: await detectConverters(), // from Phase 14
  theme: localStorage.getItem('papercut-theme'),
};
```

**Confidence:** HIGH — URL template approach is well-established and privacy-respecting.

### Pattern 3: Splash Screen in Tauri v2

**What:** Brief logo display on app launch.

**Tauri v2 approach:** Create a splash screen window in `tauri.conf.json`, show it initially, then close it when the main window is ready.

```json
{
  "app": {
    "windows": [
      {
        "label": "splashscreen",
        "url": "splashscreen.html",
        "width": 400,
        "height": 300,
        "decorations": false,
        "center": true,
        "resizable": false,
        "transparent": true
      },
      {
        "label": "main",
        "visible": false,
        ...existing config...
      }
    ]
  }
}
```

Main window shows itself and closes splash after frontend is loaded:
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// In main app mount:
const splash = await WebviewWindow.getByLabel('splashscreen');
await splash?.close();
await getCurrentWindow().show();
```

**Alternative (simpler):** Just render a full-screen logo overlay in React that fades out after 1.5s. Avoids multi-window complexity.

**Recommendation:** Use the React overlay approach — simpler, no Tauri window management, works consistently across platforms.

**Confidence:** MEDIUM — both approaches work; React overlay is simpler but less "native."

### Pattern 4: Opt-In Crash Reports

**What:** Capture unhandled errors and offer to send them (user must explicitly opt in).

**Implementation approach:**
1. Global error boundary (already exists: `AppErrorBoundary` in `ErrorBoundary.tsx`)
2. Rust `panic` hook for backend crashes
3. On crash: show dialog with error details, "Send Report" button
4. "Send Report" opens GitHub issue URL with crash details pre-filled (same as feedback pattern)

**Privacy requirements:**
- Never send anything automatically
- Show user exactly what will be sent before sending
- No telemetry, no analytics, no tracking
- Store preference in `papercut-settings.json` via Tauri store plugin

**Confidence:** HIGH — uses existing error boundary pattern + GitHub URL approach.

### Pattern 5: Version Bump Strategy

**What:** Coordinate version across three files.

Files to update:
1. `src-tauri/tauri.conf.json` — `"version": "1.0.0-beta.1"`
2. `package.json` — `"version": "1.0.0-beta.1"`
3. `src-tauri/Cargo.toml` — `version = "1.0.0-beta.1"`

**Note:** `Cargo.toml` follows semver but pre-release identifiers like `beta.1` are valid.

**Confidence:** HIGH.

### Pattern 6: CHANGELOG Generation

**Options:**
1. **`git-cliff`** — Rust-based, reads conventional commits, generates CHANGELOG.md. Can run in CI.
2. **GitHub's auto-generated release notes** — Built into GitHub Releases, requires no tooling.
3. **`conventional-changelog`** — Node.js based, well-established.

**Recommendation:** Use GitHub's built-in auto-generated release notes for releases + `git-cliff` in CI for CHANGELOG.md file. The existing commit messages follow `type(scope): message` convention (e.g., `docs(15):`, `fix:`, `docs(phase-14):`), which `git-cliff` handles well.

**Confidence:** MEDIUM — depends on commit message consistency.

### Anti-Patterns to Avoid

- **Bundling secrets in the app:** Never embed GitHub tokens or API keys. Use URL templates for feedback/issues.
- **Default-on telemetry:** Violates the project's privacy promise. All reporting must be opt-in.
- **Skipping update signature:** Even without code signing, Tauri updater needs its own signing key pair. Don't skip this.
- **Building without caching:** CI builds for 4 platforms are slow. Always cache Rust target dirs and npm.
- **Monolithic CI workflow:** Separate "check on PR" from "build + release." Release builds are expensive; PRs only need type-check + tests + clippy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-update | Custom download + replace logic | `tauri-plugin-updater` | Handles signatures, rollback, platform differences |
| CI build matrix | Custom shell scripts per platform | `tauri-apps/tauri-action@v0` | Handles platform-specific build quirks, artifact upload |
| Release artifact management | Manual upload to GitHub | `tauri-apps/tauri-action` `releaseBody` / `releaseDraft` | Handles DMG/MSI/AppImage creation and upload |
| CHANGELOG generation | Manual markdown editing | `git-cliff` or GitHub auto release notes | Consistency, automation |
| Icon generation (multi-size) | Manual resizing | `tauri icon` CLI command | Generates all required sizes from a single source PNG |
| Dark mode CSS | Custom media queries | Existing `globals.css` oklch vars + `.dark` class | Already set up with shadcn/ui theming |

**Key insight:** Tauri v2 has official plugins and CLI tools for nearly everything in this phase. The overhead of custom solutions is unjustified.

## Common Pitfalls

### Pitfall 1: Linux CI Build Dependencies

**What goes wrong:** Linux Tauri builds fail in GitHub Actions because system dependencies are missing.
**Why it happens:** Tauri requires `webkit2gtk`, `libappindicator`, and other system libraries for Linux builds.
**How to avoid:** Use `ubuntu-22.04` (not `latest` which may be 24.04) and install dependencies:
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```
**Warning signs:** Build fails with "Package webkit2gtk-4.1 was not found" or similar.
**Confidence:** HIGH — well-documented Tauri requirement.

### Pitfall 2: Tauri Updater Signing vs Code Signing Confusion

**What goes wrong:** Conflating Tauri update signatures with macOS/Windows code signing.
**Why it happens:** Both involve "signing" but serve different purposes.
**How to avoid:** Generate Tauri signing keys separately (`tauri signer generate`). Store private key as GitHub secret. Code signing is explicitly out of scope for beta.
**Warning signs:** Updater config errors about missing pubkey.
**Confidence:** HIGH.

### Pitfall 3: GS Sidecar Removal Breaking PDF Compression

**What goes wrong:** Removing the GS sidecar breaks PDF compression, PDF/A conversion, and repair features.
**Why it happens:** Multiple Rust commands use `.sidecar("gs")` — at least 5 call sites in `lib.rs`.
**How to avoid:** Implement a fallback chain: (1) try sidecar path, (2) try system `gs`/`gswin64c`, (3) return a clear error. Use the detect_converters pattern from Phase 14.
**Warning signs:** "Failed to locate Ghostscript sidecar" errors after removing `externalBin`.
**Confidence:** HIGH — verified by grep of `lib.rs`.

### Pitfall 4: E2E Tests in CI Requiring Display Server

**What goes wrong:** WebDriverIO E2E tests fail in CI because there's no display server.
**Why it happens:** GUI apps need a display. Linux CI runners are headless.
**How to avoid:** Use `xvfb-run` on Linux for E2E tests:
```yaml
- name: E2E tests
  if: matrix.platform == 'ubuntu-22.04'
  run: xvfb-run npm run test:e2e
```
macOS and Windows CI runners have display servers by default.
**Warning signs:** "No DISPLAY environment variable" or "Failed to connect to display."
**Confidence:** HIGH — `wdio.conf.ts` already has Linux headless handling (line 76-78).

### Pitfall 5: Large CI Build Times

**What goes wrong:** Full Tauri builds for 4 platforms take 30+ minutes per platform.
**Why it happens:** Rust compilation is slow, especially release builds.
**How to avoid:**
- Use `swatinem/rust-cache@v2` (already in release.yml)
- Run type-check and unit tests as a separate fast job that gates the expensive build jobs
- Use `fail-fast: false` on build matrix (already set)
- Consider only building on tagged releases / manual dispatch, not every PR
**Warning signs:** CI bills growing, PRs waiting 2+ hours for builds.
**Confidence:** HIGH.

### Pitfall 6: Version Mismatch Across Files

**What goes wrong:** Version in `tauri.conf.json` doesn't match `package.json` or `Cargo.toml`.
**Why it happens:** Three files need manual sync.
**How to avoid:** Create a version bump script or use `cargo-edit` + `npm version` together. Add a CI check that verifies all three match.
**Warning signs:** Updater shows wrong version, "About" dialog shows stale version.
**Confidence:** HIGH.

## Code Examples

### Tauri Updater Setup (Rust — Cargo.toml addition)

```toml
[dependencies]
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

### Tauri Updater Setup (Rust — lib.rs plugin registration)

```rust
// In the existing run() function, add to plugin chain:
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

### Tauri Updater Setup (JS — npm install)

```bash
npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process
```

### Capabilities Addition (default.json)

```json
"updater:default",
"process:allow-restart"
```

### Update Check Component Pattern

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  try {
    const update = await check();
    if (update) {
      // Show UI: "Update available: v{update.version}"
      // On user confirm:
      await update.downloadAndInstall((progress) => {
        // Update progress bar
      });
      await relaunch();
    }
  } catch (e) {
    // Silently fail — don't block the user
    console.warn('Update check failed:', e);
  }
}
```

### Feedback URL Template

```typescript
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-opener';

async function openFeedback() {
  const version = await getVersion();
  const os = navigator.platform;
  const body = encodeURIComponent(
    `## Feedback\n\n<!-- Describe your feedback -->\n\n## System Info\n- App Version: ${version}\n- OS: ${os}\n- Theme: ${localStorage.getItem('papercut-theme') ?? 'system'}`
  );
  await open(`https://github.com/OWNER/REPO/issues/new?labels=feedback&body=${body}`);
}
```

### About Dialog Data

```typescript
import { getVersion } from '@tauri-apps/api/app';

// Display: version, Tauri version, OS, privacy statement, links
const aboutInfo = {
  appName: 'Papercut',
  version: await getVersion(),
  description: 'Your local document toolkit — private, fast, offline.',
  license: 'MIT',
  website: 'https://github.com/OWNER/REPO',
};
```

### Linux CI Matrix Entry

```yaml
- platform: ubuntu-22.04
  target: x86_64-unknown-linux-gnu
```

With prerequisites step:
```yaml
- name: Install Linux dependencies
  if: matrix.platform == 'ubuntu-22.04'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Icon Generation

```bash
# From a 1024x1024 source PNG:
npx tauri icon path/to/source-icon.png
# Generates all sizes in src-tauri/icons/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri v1 updater (built-in) | `tauri-plugin-updater` (v2 plugin) | Tauri v2 release | Must use plugin, not built-in |
| `tauri-action@v1` | `tauri-action@v0` (v2-compatible) | Tauri v2 release | Already using correct version |
| `webkit2gtk-4.0` | `webkit2gtk-4.1` | Ubuntu 22.04+ | Linux builds need `-4.1` dev package |

## Open Questions

1. **GS Sidecar Removal Scope**
   - What we know: The context says "don't bundle," but the app currently bundles GS as a sidecar with 5+ Rust call sites using `.sidecar("gs")`.
   - What's unclear: Whether to fully remove sidecar support or keep it as a fallback (sidecar if present, system GS otherwise).
   - Recommendation: Implement a dual-path approach — try system GS first (from detect_converters), fall back to sidecar if present. Remove GS from `externalBin` in tauri.conf.json and from the release workflow. This is a dedicated task.

2. **Tauri Update Signing Key Management**
   - What we know: Tauri updater requires a signing key pair even without code signing.
   - What's unclear: Where to store the private key for CI (GitHub secret).
   - Recommendation: Generate key with `tauri signer generate`, store private key as `TAURI_SIGNING_PRIVATE_KEY` GitHub secret, embed public key in `tauri.conf.json`.

3. **License Key Architecture Pre-Wiring**
   - What we know: Monetization is deferred, but user gave Claude's discretion on whether to pre-wire hooks.
   - What's unclear: Whether the overhead is worth it for beta.
   - Recommendation: Don't pre-wire. Add a simple `isLicensed()` stub function that always returns `true`. This is enough of a hook point without over-engineering. Revisit after beta feedback confirms demand.

4. **CI Build Cost for Full 4-Platform Builds on Every PR**
   - What we know: Each platform build takes 15-30 minutes. 4 platforms = 60-120 minutes of CI per PR.
   - What's unclear: Whether the user's GitHub plan has enough CI minutes.
   - Recommendation: Split CI into two workflows: (a) fast checks on every push/PR (typecheck, lint, unit tests, clippy — ~5 min), (b) full platform builds only on tags + manual dispatch. Add platform builds to PRs only if CI budget allows.

## Existing File Inventory (Relevant to Phase 15)

| File | Relevance |
|------|-----------|
| `.github/workflows/release.yml` | Starting point for release CI — needs Linux target, CI workflow split |
| `src-tauri/tauri.conf.json` | Version bump, updater config, icon paths, remove GS externalBin |
| `src-tauri/Cargo.toml` | Version bump, add updater + process plugins |
| `package.json` | Version bump, add updater + process JS packages |
| `src-tauri/src/lib.rs` | Register updater/process plugins, GS sidecar refactor |
| `src-tauri/capabilities/default.json` | Add updater + process permissions |
| `src-tauri/icons/` | Replace with custom icon (all sizes) |
| `src/App.tsx` | Splash screen overlay, update check on mount |
| `src/components/Dashboard.tsx` | Layout polish, about button |
| `src/components/ThemeToggle.tsx` | Already exists — dark mode works |
| `src/styles/globals.css` | Dark mode vars already defined — may need refinement |
| `src/components/ErrorBoundary.tsx` | Extend for crash report opt-in |
| `src/components/PrivacyFooter.tsx` | Already exists |
| `src/components/FirstLaunchBanner.tsx` | Already exists — privacy banner |
| `src/hooks/useTheme.ts` | Already exists — light/dark/system |
| `src/e2e/wdio.conf.ts` | E2E config — needs CI integration |
| `README.md` | Boilerplate — needs complete rewrite |

## Sources

### Primary (HIGH confidence)
- Codebase analysis — `tauri.conf.json`, `release.yml`, `lib.rs`, `package.json`, `Cargo.toml`, all UI components
- Tauri v2 plugin architecture — verified by existing plugin usage patterns in the codebase (`tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-store`, `tauri-plugin-shell`, `tauri-plugin-opener`)
- GitHub Actions — verified by existing `release.yml` workflow

### Secondary (MEDIUM confidence)
- Tauri v2 updater plugin API — based on Tauri v2 plugin convention patterns (same as other v2 plugins in codebase)
- Linux build dependencies — based on established Tauri v2 requirements for Ubuntu 22.04
- `git-cliff` for CHANGELOG — based on known tooling; specific integration needs validation

### Tertiary (LOW confidence)
- Exact `tauri-plugin-updater` configuration schema — needs validation against current Tauri v2 docs during implementation
- GitHub Actions CI minute costs for 4-platform builds — depends on user's plan

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing codebase provides clear foundation, minimal new dependencies
- Architecture: HIGH — patterns follow established Tauri v2 conventions already used in the project
- Pitfalls: HIGH — identified from codebase analysis (GS sidecar conflict, Linux deps, E2E display)
- UI polish scope: MEDIUM — specific improvements need design decisions during implementation

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (30 days — Tauri v2 is stable, low churn expected)
