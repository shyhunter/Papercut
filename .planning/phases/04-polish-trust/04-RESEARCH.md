# Phase 4: Polish & Trust — Research

**Researched:** 2026-02-23
**Domain:** Tauri v2 persistent storage, file-system existence checks, privacy architecture, error UX patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Recent Directories UI**
- Surfaced as a floating quick-access button on the landing card — opens a dropdown of recent dirs
- Store and show the 5 most recent directories
- Stale paths (deleted/moved/unmounted) are silently hidden on load — user never sees invalid entries
- Clicking a shortcut opens the native file picker pre-navigated to that directory — user still picks the file

**Privacy Verification**
- Both a developer-facing test AND a user-facing trust signal
- Trust signal: footer / status bar — persistent at the bottom of the app window
- Style: lock icon + "Processed locally" text — literal, no ambiguity
- Automated test covers both static config check (tauri.conf.json has no network-granting capabilities) AND a runtime intercept (run a processing command, assert zero outbound network requests)

**Error UX for Bad Inputs**
- Unsupported file type dropped: Inline error on the drop zone (error state with message, clears after a moment) — stay on landing
- Pre-drop hover feedback: Drop zone turns red/warning highlight when hovering an unsupported file type — before the user drops (already implemented in useFileDrop)
- Corrupt/unreadable file (processing failure): Toast notification + return to landing — "Could not read file — it may be corrupted"
- Save As dialog cancelled: Brief "Save cancelled" toast, stay on SaveStep — user can try again

### Claude's Discretion
- Exact dropdown animation and positioning for the recent dirs button
- How the drop zone detects file type during drag hover (may be limited by Tauri's drag event API)
- Timing/duration of the inline drop zone error state before it clears
- Footer layout integration with existing app chrome

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FINP-03 | App remembers recently used directories and offers them as shortcuts in the file picker | tauri-plugin-store for persistence; `open({ defaultPath })` for pre-navigation; `fs:allow-exists` for stale path filtering |
| UX-03 | No file data is ever sent to any external server or service (verified: no outbound network calls for processing) | Tauri v2 has no HTTP capability registered; CSP is null (per tauri.conf.json); static config assertion + vitest fetch spy pattern |
</phase_requirements>

---

## Summary

Phase 4 closes out v1.0 with three feature areas: recent-directory shortcuts, a privacy trust signal, and edge-case error hardening. All three areas fit cleanly within the existing Tauri v2 + React + Tailwind stack with one new dependency (tauri-plugin-store).

**Recent directories** require the `@tauri-apps/plugin-store` / `tauri-plugin-store` plugin for persistent storage. The store saves an array of up to 5 directory strings, keyed by path. On load, each stored path is validated with `exists()` from `@tauri-apps/plugin-fs`; stale entries are silently dropped before rendering. The native file picker is pre-navigated by passing the stored path as `defaultPath` to the existing `open()` call. The UI uses a shadcn/ui Popover (not yet installed; requires `npx shadcn@latest add popover`) surfaced as a floating button on LandingCard.

**Privacy verification** has two parts. The static part confirms the capabilities file grants no HTTP-enabling permissions — Tauri v2 blocks outbound network by default since neither `tauri-plugin-http` nor any `http:*` capability is registered, and the CSP is `null` in `tauri.conf.json`. The runtime part uses vitest's `vi.stubGlobal('fetch', vi.fn())` to intercept any `window.fetch` call during a mock processing run, then asserts `toHaveBeenCalledTimes(0)`. The user-facing signal is a footer bar using Lucide's `Lock` icon + "Processed locally" text, integrated into App.tsx below the step routing.

**Error hardening** works with existing infrastructure: the `dragState === 'over-invalid'` state in `useFileDrop` already triggers the red card style; what's missing is a brief inline error message on the LandingCard when an invalid file is actually dropped, plus corrupt-file and save-cancel toast paths in App.tsx/SaveStep.

**Primary recommendation:** Add tauri-plugin-store for persistence, shadcn Popover for the recent-dirs dropdown, and write the privacy test as a pure Vitest unit test (no Tauri runtime required).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tauri-apps/plugin-store` | 2.4.2 | Persist recent-dirs array across sessions | Only official Tauri v2 persistent KV solution; file-backed, survives app restart |
| `tauri-plugin-store` (Rust) | 2 (matches JS) | Rust side of plugin-store | Required pairing — JS API calls into Rust implementation |
| `@tauri-apps/plugin-fs` | already installed | `exists()` to filter stale paths | Already in project; `exists()` API confirmed in v2 |
| `@tauri-apps/plugin-dialog` | already installed | `open({ defaultPath })` pre-navigates picker to dir | Already in project; confirmed `defaultPath` as directory opens picker there |

### Supporting UI
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Popover | via `npx shadcn@latest add popover` | Floating dropdown for recent dirs button | Not yet installed; needed for accessible, collision-aware floating panel |
| lucide-react `Lock` icon | already installed (0.575+) | Privacy footer icon | Already in dependencies; Lock icon present in lucide-react |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tauri-plugin-store | localStorage | localStorage works but persists in WebView storage which is harder to inspect/debug; store plugin writes to a JSON file in app data dir — more transparent and survives browser storage clears |
| tauri-plugin-store | Custom Tauri command writing JSON | More code, same outcome; plugin-store is the standard Tauri idiom |
| shadcn Popover | Headless floating div with manual z-index | Popover handles collision detection (avoidCollisions), portal rendering, focus trapping, escape key — manual implementation is error-prone |

**Installation (new dependencies only):**
```bash
# In project root
npm install @tauri-apps/plugin-store
npx shadcn@latest add popover

# In src-tauri/
cargo add tauri-plugin-store
```

---

## Architecture Patterns

### Recommended Project Structure (additions)
```
src/
├── hooks/
│   ├── useRecentDirs.ts        # NEW: load/save/validate recent dirs via plugin-store
│   └── useFileDrop.ts          # EXISTS: minor extension for inline error state
├── components/
│   ├── LandingCard.tsx         # EXISTS: add RecentDirsButton + inline error state
│   ├── PrivacyFooter.tsx       # NEW: lock icon + "Processed locally" persistent footer
│   └── ui/
│       └── popover.tsx         # NEW: shadcn Popover (via `npx shadcn@latest add popover`)
src-tauri/
├── capabilities/
│   └── default.json            # EXISTS: add store:default permission, fs:allow-exists scoped to $HOME/**
├── Cargo.toml                  # EXISTS: add tauri-plugin-store = "2"
└── src/lib.rs                  # EXISTS: add .plugin(tauri_plugin_store::Builder::new().build())
```

### Pattern 1: Recent Dirs Hook (useRecentDirs)
**What:** Custom hook encapsulating all store interaction — load, validate (via `exists()`), add, persist.
**When to use:** Called once in App.tsx or LandingCard; passed downward as props.

```typescript
// Source: Tauri v2 store docs — https://v2.tauri.app/plugin/store/
import { LazyStore } from '@tauri-apps/plugin-store';
import { exists } from '@tauri-apps/plugin-fs';
import { useEffect, useState, useCallback } from 'react';
import path from 'path';

const store = new LazyStore('papercut-settings.json');
const RECENT_DIRS_KEY = 'recentDirs';
const MAX_RECENT = 5;

export function useRecentDirs() {
  const [dirs, setDirs] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const saved = await store.get<string[]>(RECENT_DIRS_KEY) ?? [];
      // Filter stale paths silently
      const valid: string[] = [];
      for (const d of saved) {
        if (await exists(d)) valid.push(d);
      }
      setDirs(valid);
    })();
  }, []);

  const addDir = useCallback(async (filePath: string) => {
    const dir = filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
    setDirs(prev => {
      const without = prev.filter(d => d !== dir);
      return [dir, ...without].slice(0, MAX_RECENT);
    });
    // Persist immediately after state update would be stale; use functional update result
    const saved = await store.get<string[]>(RECENT_DIRS_KEY) ?? [];
    const without = saved.filter(d => d !== dir);
    const next = [dir, ...without].slice(0, MAX_RECENT);
    await store.set(RECENT_DIRS_KEY, next);
    await store.save();
  }, []);

  return { dirs, addDir };
}
```

### Pattern 2: Pre-navigating the File Picker
**What:** Pass the stored directory path as `defaultPath` to `open()`.
**When to use:** User clicks a recent-dir shortcut.

```typescript
// Source: Tauri v2 dialog docs — https://v2.tauri.app/reference/javascript/dialog/
import { open } from '@tauri-apps/plugin-dialog';

async function openFromDir(dir: string): Promise<string | null> {
  const result = await open({
    multiple: false,
    directory: false,
    defaultPath: dir,  // Confirmed: directory path opens picker in that folder
    filters: [{ name: 'Supported Files', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] }],
  });
  return typeof result === 'string' ? result : null;
}
```

### Pattern 3: Privacy Test — Vitest fetch spy
**What:** Stub `window.fetch` before running a processing call, assert it is never invoked.
**When to use:** Privacy verification test — proves no outbound network.

```typescript
// Source: Vitest docs — https://vitest.dev/api/vi.html
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('privacy: no outbound network requests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('processImage invokes Rust IPC but never calls window.fetch', async () => {
    // ... mock IPC, call processing ...
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});
```

### Pattern 4: Static Config Assertion
**What:** Parse `tauri.conf.json` and `capabilities/default.json` in a test and assert no HTTP-granting permissions appear.

```typescript
import { readFileSync } from 'fs';
import path from 'path';

it('capabilities grant no HTTP access', () => {
  const cap = JSON.parse(
    readFileSync(path.join(__dirname, '../../../src-tauri/capabilities/default.json'), 'utf-8')
  );
  const perms: string[] = cap.permissions.map((p: string | { identifier: string }) =>
    typeof p === 'string' ? p : p.identifier
  );
  const httpPerms = perms.filter((p: string) => p.startsWith('http:'));
  expect(httpPerms).toHaveLength(0);
});
```

### Pattern 5: Footer Integration in App.tsx
**What:** Add a fixed-height footer row below step routing in the `flex h-screen flex-col` layout.
**When to use:** Always rendered; step-independent.

```tsx
// Existing structure in App.tsx:
// <div className="flex h-screen flex-col bg-background text-foreground">
//   <StepBar current={currentStep} />
//   {/* step routing ... */}
//   <Toaster position="bottom-center" />
// </div>

// Add PrivacyFooter before Toaster:
// <PrivacyFooter />
// <Toaster position="bottom-center" />
```

### Anti-Patterns to Avoid
- **Writing to store on every render:** Call `store.save()` only after state changes, not on reads. LazyStore loads lazily — no explicit `load()` call needed before `get()`.
- **Using `fs:allow-read-file` for `exists()` checks:** The `exists()` function needs its own `fs:allow-exists` permission scoped to `$HOME/**`. The existing `fs:allow-read-file` does NOT cover `exists()`.
- **Deriving directory from file path in the UI:** Extract the directory in `addDir()` inside the hook, not in component code.
- **Assuming `open()` defaultPath is always respected on all platforms:** Windows requires backslash separators; macOS/Linux use forward slash. Use the path string as-is from the Tauri `onDragDropEvent` or picker return — it will already use native separators.
- **Rendering all 5 recent dirs as always-visible buttons:** Embed them in a Popover to avoid cluttering the landing card. The user decision specifies a floating quick-access button that opens a dropdown.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistent KV storage | Custom Rust command writing a JSON file | `tauri-plugin-store` | Plugin handles atomic writes, file location ($APPDATA), change listeners, and the IPC plumbing — ~50 lines of custom code vs 2 lines |
| Floating accessible dropdown | Raw `<div>` with `position: absolute` | shadcn `Popover` (built on Radix UI) | Handles viewport collision detection, portal z-index, escape key, focus trap, ARIA attributes |
| Path existence check | `readFile()` and catching the error | `exists()` from `@tauri-apps/plugin-fs` | `exists()` returns bool cleanly; `readFile()` throws on directories; semantic clarity |

**Key insight:** Tauri v2's plugin ecosystem handles the IPC boilerplate for the store. The JS API (`LazyStore`) looks and feels like a simple async key-value store — all complexity is in the Rust plugin.

---

## Common Pitfalls

### Pitfall 1: `fs:allow-exists` Scope Mismatch
**What goes wrong:** Adding `"fs:allow-exists"` to capabilities without a path scope causes "forbidden path" errors at runtime when checking arbitrary home directory paths.
**Why it happens:** Tauri v2 fs permissions require explicit path scopes. Without `"allow": [{ "path": "$HOME/**" }]`, the permission grants nothing.
**How to avoid:**
```json
{
  "identifier": "fs:allow-exists",
  "allow": [{ "path": "$HOME/**" }]
}
```
**Warning signs:** `exists()` throws an error rather than returning `false`; error message mentions "forbidden path".

### Pitfall 2: LazyStore `save()` Omitted
**What goes wrong:** Calling `store.set()` updates in-memory state but the data is lost on app restart.
**Why it happens:** `LazyStore` and `load()` with default `autoSave: false` do not auto-persist writes.
**How to avoid:** Always call `await store.save()` after `set()`. Alternatively use `load('...', { autoSave: true })` but this saves on every change which may be excessive.
**Warning signs:** Recent dirs list resets to empty after app restart during testing.

### Pitfall 3: `exists()` on a File Path Extracted Incorrectly on Windows
**What goes wrong:** Extracting the directory from a Windows file path using forward-slash split gives a wrong path, causing `exists()` to return `false` for a valid directory.
**Why it happens:** Windows paths use backslashes (`C:\Users\...`); a naive `.split('/')` only splits on `/`.
**How to avoid:** Normalize path separators before splitting: `filePath.replace(/\\/g, '/')` then split on `/`. This matches the existing pattern in `fileValidation.ts → getFileName()`.

### Pitfall 4: Popover z-index Conflict with Tauri Window Chrome
**What goes wrong:** Popover renders beneath other elements because it's not portalled.
**Why it happens:** shadcn Popover portals to `document.body` by default — this is correct. Problems arise only if you wrap the Popover in a container with `overflow: hidden` or `isolation: isolate`.
**How to avoid:** Do not wrap the trigger in an `overflow: hidden` ancestor. The existing LandingCard uses `overflow` implicitly via `rounded-xl` — verify the Popover content renders outside the card's clipping context.

### Pitfall 5: Privacy Test Environment Confusion
**What goes wrong:** Privacy test asserts `fetch` was not called, but the Tauri IPC mock uses its own mechanism (not `window.fetch`), so the assertion passes trivially — even if real code used fetch.
**Why it happens:** The existing `setup.ts` mocks `@tauri-apps/api/core` invoke via `vi.mock()`, not via fetch. IPC is not fetch.
**How to avoid:** The privacy test must call a real code path (not just the mock) and verify that no *additional* fetch calls occurred beyond IPC. Since IPC doesn't use `window.fetch`, the spy on `window.fetch` is a clean signal. Document this explicitly in the test comment.

### Pitfall 6: Corrupt File Error Handling Already Has a Path
**What goes wrong:** Corrupt file handling is currently absent — `usePdfProcessor` and `useImageProcessor` set an error state, but App.tsx doesn't observe this error to navigate back to landing.
**Why it happens:** Phase 3 left error display inside ConfigureStep/ImageConfigureStep (inline error under the Generate button). No global handler navigates back.
**How to avoid:** Add an `onProcessingError` prop or observe `pdfProcessor.error` / `imageProcessor.error` in App.tsx when on step 1, trigger a toast + `handleStartOver()`.

---

## Code Examples

### Store Setup (lib.rs)
```rust
// Source: https://v2.tauri.app/plugin/store/
.plugin(tauri_plugin_store::Builder::new().build())
// Add BEFORE the existing plugins; order does not affect functionality
```

### Capabilities — Complete diff
```json
// src-tauri/capabilities/default.json — add to "permissions" array:
"store:default",
{
  "identifier": "fs:allow-exists",
  "allow": [{ "path": "$HOME/**" }]
}
```

### PrivacyFooter Component
```tsx
// Source: lucide-react Lock icon (already in dependencies)
import { Lock } from 'lucide-react';

export function PrivacyFooter() {
  return (
    <footer className="flex items-center justify-center gap-1.5 py-2 border-t border-border/40 text-muted-foreground">
      <Lock className="h-3 w-3" />
      <span className="text-xs">Processed locally</span>
    </footer>
  );
}
```

### LandingCard Inline Error State
```tsx
// Add to LandingCard component — state managed in parent (App.tsx) or locally
// Error clears after N ms via setTimeout in App.tsx handleFileSelected for invalid drop

// In LandingCard, below the card:
{invalidDropError && (
  <p className="text-sm text-destructive text-center mt-2 animate-in fade-in">
    {invalidDropError}
  </p>
)}
```

### Save Cancel Toast (existing SaveStep pattern)
```tsx
// In SaveStep.tsx — when savePath is null (user cancelled):
// Current: calls onCancel() silently
// Change: also show a toast before calling onCancel()
toast('Save cancelled', { description: 'You can try again any time.' });
onCancel();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri v1 allowlist for HTTP | Tauri v2 capability-based permissions — HTTP blocked unless `tauri-plugin-http` installed | Tauri v2.0 stable (Oct 2024) | Privacy verification is structurally stronger — no `http:*` capability = no outbound HTTP possible from app code |
| Tauri v1 `tauri::api::file::read_binary_file` | `@tauri-apps/plugin-fs` with scope-based permissions | Tauri v2.0 | Already using correct v2 API |
| Manual localStorage for app prefs | `tauri-plugin-store` (file-backed JSON) | Tauri v1 era | More reliable, inspectable, doesn't share storage with WebView profile data |

**Deprecated/outdated:**
- `@tauri-apps/api/dialog` (Tauri v1): This project already correctly uses `@tauri-apps/plugin-dialog` (v2).
- Tauri v1 `allowlist.http.all: false`: Replaced by absence of `tauri-plugin-http` in Cargo.toml.

---

## Existing Code Observations (integration notes for planner)

### Current App.tsx structure
The root `<div>` is `flex h-screen flex-col`. The Toaster is the last child. The footer should be inserted as the second-to-last child (before Toaster). No existing footer exists.

### dragState already handles hover
`useFileDrop` already emits `over-invalid` for unsupported files during drag hover — this already triggers red card styling in LandingCard. What's missing is the inline error message when the user actually **drops** an unsupported file (the `handleFileSelected('')` call path in App.tsx).

### Error handling gap
When `handleFileSelected('')` is called (invalid drop), the current App.tsx fires `toast.error(...)` via sonner. The CONTEXT.md decision says to use an **inline drop zone error**, not a toast. This needs to change: suppress the toast for invalid drops, show an inline message on LandingCard instead, and auto-clear it after ~2 seconds.

### Corrupt file path
`pdfProcessor.error` and `imageProcessor.error` are set when processing fails. App.tsx currently does NOT watch these to navigate back. The corrupt-file UX requires:
1. Watching `pdfProcessor.error` / `imageProcessor.error` in App.tsx
2. When error is set while on step 1, show `toast.error(...)` and call `handleStartOver()`

### Save cancel path
In `SaveStep.tsx`, when `save()` returns `null` (user cancelled), `onCancel()` is called silently. Caller (`App.tsx`) then calls `setCurrentStep(2)`. The decision requires a "Save cancelled" toast. This can be added inside `SaveStep` before `onCancel()` call (or in App.tsx's `onCancel` handler — either works).

---

## Open Questions

1. **`exists()` permission scope for network drives / external volumes**
   - What we know: `$HOME/**` covers most user directories on macOS and Linux; on Windows it covers `C:\Users\username\**`
   - What's unclear: Network-mounted drives or external drives outside `$HOME` may return "forbidden path" even if the directory physically exists
   - Recommendation: Use `$HOME/**` for the initial implementation. The decision says stale paths are "silently hidden" — a "forbidden path" error is also silent (catch it, treat as stale). This is safe.

2. **Popover animation preference**
   - What we know: shadcn Popover includes Tailwind-based enter/exit animations via `data-state` attributes
   - What's unclear: Whether the user prefers a plain instant appear vs. a fade-in
   - Recommendation: Claude's Discretion — use shadcn defaults (subtle scale + fade), which match the existing app aesthetic.

3. **`window.fetch` in Tauri v2 — is it available at all?**
   - What we know: Tauri v2 uses the system WebView (WKWebView on macOS, WebView2 on Windows). Both expose native `window.fetch`. The CSP in `tauri.conf.json` is `null`, which disables CSP enforcement.
   - What's unclear: Whether Tauri intercepts fetch at a lower level to block non-IPC requests.
   - Recommendation: The privacy test works regardless — stub `window.fetch` in Vitest, verify it's never called by processing code. Whether native fetch would be blocked in production is a defense-in-depth question; the plugin-based architecture (no http plugin, no http capability) is the primary guarantee.

---

## Sources

### Primary (HIGH confidence)
- [Tauri v2 Store Plugin docs](https://v2.tauri.app/plugin/store/) — installation, LazyStore API, autoSave behavior
- [Tauri v2 dialog reference](https://v2.tauri.app/reference/javascript/dialog/) — `open()` `defaultPath` as directory behavior confirmed
- [Tauri v2 fs reference](https://v2.tauri.app/reference/javascript/fs/) — `exists()` function signature and `fs:allow-exists` permission
- [Tauri v2 HTTP Client docs](https://v2.tauri.app/plugin/http-client/) — confirmed: separate plugin required for outbound HTTP
- [shadcn/ui Popover](https://www.shadcn.io/ui/popover) — install command, component API

### Secondary (MEDIUM confidence)
- [npm @tauri-apps/plugin-store](https://www.npmjs.com/package/@tauri-apps/plugin-store) — version 2.4.2 confirmed via `npm show`
- [Tauri v2 permissions docs](https://v2.tauri.app/security/permissions/) — capability-based ACL system
- [GitHub issue: `fs:allow-exists` requires scope](https://github.com/tauri-apps/plugins-workspace/issues/1533) — confirmed that unscoped `fs:allow-exists` fails with "forbidden path"
- [Vitest mocking guide](https://vitest.dev/guide/mocking) — `vi.stubGlobal`, `not.toHaveBeenCalled()` patterns

### Tertiary (LOW confidence)
- [GitHub issue: defaultPath bug on Windows with forward slash](https://github.com/tauri-apps/tauri/issues/8074) — path separator issue on Windows; may affect pre-navigation reliability on Windows

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tauri-plugin-store confirmed as official Tauri v2 solution; versions verified via npm
- Architecture: HIGH — patterns derived from official docs and existing codebase analysis
- Pitfalls: HIGH for fs scope and store.save() (backed by GitHub issues); MEDIUM for Popover z-index (general knowledge + shadcn behavior)
- Privacy testing: HIGH — vitest `vi.stubGlobal` pattern is official Vitest API; static config parsing is straightforward

**Research date:** 2026-02-23
**Valid until:** 2026-03-25 (stable APIs — tauri-plugin-store, shadcn/ui Popover)
