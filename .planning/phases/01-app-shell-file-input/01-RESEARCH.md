# Phase 1: App Shell & File Input - Research

**Researched:** 2026-02-19
**Domain:** Tauri 2 desktop app shell, React UI, drag-and-drop file input
**Confidence:** HIGH (core APIs verified via official docs), MEDIUM (visual patterns), LOW (one drag-drop platform edge case)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Landing screen:** Centered card layout — not full-screen drop zone, not minimal empty screen
- **File picker / drop zone prominence:** Side by side or stacked with equal visual weight
- **Visual tone:** Polished and modern — subtle gradients, shadows, touch of color; feels like a well-crafted native app
- **Tagline:** Subtle tagline below or above the card (e.g. "Compress, resize, convert — stays on your device")
- **Drag target:** The entire window is a drop target, but the card animates in response
- **Card drag-over feedback:** Border glows, background shifts, subtle scale
- **Mid-drag validation:** Green signal for valid file types, red (or neutral) for unsupported — user knows before dropping
- **On valid file drop:** Brief progress indicator (loading bar or skeleton) before advancing
- **Step indicator placement:** Top bar — horizontal row spanning the top of the window, always visible
- **Step indicator lock state:** Future/locked steps are clearly grayed out
- **File picker restriction:** Native file picker dialog restricts to supported types: PDF, JPG, PNG, WebP
- **Stack:** Tauri + TypeScript + React (locked)

### Claude's Discretion

- Step indicator visual style (numbered, dots, labels-only)
- Step indicator click navigation behavior
- File rejection error pattern (toast, inline, modal)
- Post-rejection reset behavior and timing
- Multi-file drop handling
- Loading skeleton/spinner design
- Exact spacing, typography, and color palette within "polished and modern" direction

### Deferred Ideas (OUT OF SCOPE)

- DOCX support (v2)
- Batch processing (v2)
- Color themes / micro-animations (v2)
- Recently used directories (Phase 4)
- Any processing (PDF, image) — Phase 2 and 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FINP-01 | User can open a PDF or image file via a file picker dialog | `@tauri-apps/plugin-dialog` `open()` with filters array supports `.pdf`, `.jpg`, `.png`, `.webp`. Returns file path string. |
| FINP-02 | User can open a file by dragging and dropping it onto the app window | `getCurrentWebview().onDragDropEvent()` fires `'enter'`, `'over'`, `'drop'`, `'leave'` events with `paths[]` array. Requires `dragDropEnabled: true` (default). Extension check on `paths[0]` validates file type. |
| UX-01 | App shows a step progress indicator highlighting the current step (Pick → Configure → Compare → Save) | Hand-rolled horizontal stepper component with Tailwind CSS. No library needed — 4 fixed steps, no user navigation in Phase 1. |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield Tauri 2 project scaffold. The codebase does not yet exist — the very first task is scaffolding with `create-tauri-app`. Tauri 2 is stable (released October 2024) and its APIs are well-documented. The core file input work splits into two distinct subsystems: the native file picker (via `@tauri-apps/plugin-dialog`) and window drag-and-drop (via `getCurrentWebview().onDragDropEvent()`).

The most important architectural decision is that Tauri's `dragDropEnabled` flag controls a mutually exclusive choice: keep it `true` (default) to use Tauri's `onDragDropEvent` for file drops from the OS, or set it `false` to use the browser's native HTML5 drag events. Since Papercut needs the full file path (not just file content) and the user confirmed whole-window drag response, use `dragDropEnabled: true` and Tauri's event system. This is verified by official Tauri documentation.

For UI, the recommended stack is Tailwind CSS v4 (via `@tailwindcss/vite` plugin) plus shadcn/ui for the card and button primitives. The step progress indicator is simple enough to hand-roll — 4 fixed steps with Tailwind classes for active/completed/locked states. The whole-window drag listener sets React state (`isDragOver`, `isDragValid`) which the card reads to apply animated classes.

**Primary recommendation:** Scaffold with `npm create tauri-app@latest`, add the dialog plugin via `npm run tauri add dialog`, use Tailwind v4 + shadcn/ui for styling, and wire file input via the two distinct Tauri 2 APIs for picker and drag-drop.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tauri | 2.x (stable, Oct 2024) | Desktop app shell, window, IPC | Official Tauri 2 release |
| @tauri-apps/api | 2.x | TypeScript bindings for core APIs (window, webview, events) | Ships with Tauri 2 |
| @tauri-apps/plugin-dialog | 2.x | Native file picker dialog | Official Tauri plugin — `npm run tauri add dialog` |
| react | 18.x | UI framework | Locked decision |
| typescript | 5.x | Type safety | Locked decision |
| vite | 5.x | Dev server and bundler | Tauri 2's default frontend bundler |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.x | Utility CSS | All styling; use `@tailwindcss/vite` plugin (no PostCSS config needed) |
| @tailwindcss/vite | 4.x | Vite plugin for Tailwind v4 | Required to use Tailwind v4 with Vite |
| shadcn/ui | latest | Pre-built accessible components (Card, Button, Progress, Badge) | Use for Card container, Button (file picker trigger), and Toast (error rejection) |
| @types/node | latest | Node types for path aliases in vite.config | Required for `path.resolve()` in vite.config.ts |
| lucide-react | latest | Icon set bundled with shadcn/ui | Step indicator icons, drag-drop icons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 + shadcn/ui | Vanilla CSS or CSS Modules | Tailwind + shadcn gives polished components fast; vanilla CSS would require more custom work for the "well-crafted native" feel |
| shadcn/ui Toast for rejection | Custom modal or inline error | Toast is the least disruptive pattern for transient errors like rejected file types |
| Hand-rolled stepper | react-step-progress-bar | Library adds complexity for 4 fixed, non-interactive steps; Tailwind classes suffice |
| Tauri onDragDropEvent | HTML5 dragover/drop events | Tauri's API is required for file paths; HTML5 only gives File objects without full OS paths |

**Installation:**
```bash
# 1. Scaffold project (interactive)
npm create tauri-app@latest

# 2. In project root — add dialog plugin
npm run tauri add dialog

# 3. Add Tailwind v4 + shadcn deps
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
npx shadcn@latest init

# 4. Add shadcn components used in Phase 1
npx shadcn@latest add card button badge progress sonner
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── App.tsx                    # Root: renders StepBar + current step view
├── main.tsx                   # React entry point
├── components/
│   ├── ui/                    # shadcn/ui generated components (auto-populated)
│   ├── StepBar.tsx            # Horizontal step progress indicator
│   ├── LandingCard.tsx        # Centered card with file picker + drop zone
│   └── DragOverlay.tsx        # Full-window drag visual overlay (optional)
├── hooks/
│   ├── useFileDrop.ts         # Tauri onDragDropEvent listener + state
│   └── useFileOpen.ts         # Tauri dialog open() wrapper + state
├── types/
│   └── file.ts                # FileEntry, SupportedFormat, AppStep types
├── lib/
│   └── fileValidation.ts      # Extension-to-format mapping, validation
└── styles/
    └── globals.css            # @import "tailwindcss"; + CSS vars
src-tauri/
├── src/
│   ├── lib.rs                 # Tauri builder with plugins registered
│   └── main.rs                # App entry point
├── capabilities/
│   └── default.json           # dialog:allow-open permission
└── tauri.conf.json            # Window config: size, dragDropEnabled
```

### Pattern 1: Tauri File Picker Dialog

**What:** Call `open()` from `@tauri-apps/plugin-dialog` with format filters. Returns a file path string or null on cancel.

**When to use:** User clicks the "Open File" button.

```typescript
// Source: https://v2.tauri.app/plugin/dialog/
import { open } from '@tauri-apps/plugin-dialog';

async function openFilePicker(): Promise<string | null> {
  return await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Supported Files',
        extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      },
    ],
  });
}
```

### Pattern 2: Tauri Drag-Drop Event Listener

**What:** Register `onDragDropEvent` on the current webview. Fires `enter`, `over`, `drop`, and `leave` events. Use React state to track drag phase and validity.

**When to use:** Whole-window file drag-and-drop. Requires `dragDropEnabled: true` (default — do not change).

```typescript
// Source: https://v2.tauri.app/reference/javascript/api/namespacewebview/
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useEffect, useState } from 'react';

type DragState = 'idle' | 'over-valid' | 'over-invalid';

export function useFileDrop(onDrop: (path: string) => void) {
  const [dragState, setDragState] = useState<DragState>('idle');

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === 'enter') {
        const paths: string[] = event.payload.paths ?? [];
        const isValid = paths.length === 1 && isSupportedExtension(paths[0]);
        setDragState(isValid ? 'over-valid' : 'over-invalid');
      } else if (event.payload.type === 'over') {
        // no-op — state already set on enter
      } else if (event.payload.type === 'drop') {
        const paths: string[] = event.payload.paths ?? [];
        if (paths.length === 1 && isSupportedExtension(paths[0])) {
          onDrop(paths[0]);
        }
        setDragState('idle');
      } else {
        // leave or cancelled
        setDragState('idle');
      }
    }).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, [onDrop]);

  return dragState;
}
```

### Pattern 3: Capabilities Configuration

**What:** Tauri 2 blocks all plugin commands by default. The dialog plugin's open command must be explicitly allowed in a capabilities file.

```json
// src-tauri/capabilities/default.json
// Source: https://v2.tauri.app/security/capabilities/
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default app capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:allow-open"
  ]
}
```

### Pattern 4: Window Configuration

**What:** Set sensible window defaults for a desktop utility app.

```json
// src-tauri/tauri.conf.json (app.windows section)
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Papercut",
        "width": 740,
        "height": 520,
        "minWidth": 600,
        "minHeight": 440,
        "center": true,
        "resizable": true,
        "decorations": true,
        "dragDropEnabled": true
      }
    ]
  }
}
```

Note: `dragDropEnabled: true` is the default. Keep it true. Do NOT set it to false.

### Pattern 5: Step Indicator (Hand-Rolled)

**What:** Four fixed horizontal steps. No library needed. Tailwind utilities handle active/completed/locked visual states.

**When to use:** Always visible in the top bar. Phase 1 only ever shows step 1 as active.

```typescript
// No external library — pure Tailwind + React
const STEPS = ['Pick', 'Configure', 'Compare', 'Save'] as const;
type AppStep = typeof STEPS[number];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 border-b border-border">
      {STEPS.map((label, i) => {
        const isActive = i === current;
        const isComplete = i < current;
        const isLocked = i > current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 text-sm font-medium',
              isActive && 'text-primary',
              isComplete && 'text-muted-foreground',
              isLocked && 'text-muted-foreground/50 cursor-not-allowed',
            )}>
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs',
                isActive && 'bg-primary text-primary-foreground',
                isComplete && 'bg-muted-foreground/30',
                isLocked && 'bg-muted/50',
              )}>
                {i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Using HTML5 drag events instead of Tauri's `onDragDropEvent`:** The browser's drag API gives `File` objects, not OS file paths. You cannot get the full file path this way. Always use Tauri's event system.
- **Setting `dragDropEnabled: false`:** This disables Tauri's drag-drop interception, making `onDragDropEvent` non-functional. Only set to false if you want HTML5-only drag (not needed here).
- **Trying to target specific drop elements with Tauri drag events:** Tauri fires a single window-level event. Targeting specific elements requires manual DOMRect checking — use `dragState` on React state instead and let the card animate based on state.
- **Installing Tailwind with PostCSS for v4:** Tailwind v4 uses a Vite plugin (`@tailwindcss/vite`), not PostCSS. The old `tailwind.config.js` + `postcss.config.js` approach is deprecated for v4.
- **Forgetting `dialog:allow-open` in capabilities:** The plugin will silently fail or throw a permissions error without this. Add it to `src-tauri/capabilities/default.json` immediately after `tauri add dialog`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native file picker dialog | Custom HTML `<input type="file">` | `@tauri-apps/plugin-dialog` `open()` | Native OS dialog, supports file type restriction natively |
| Toast notifications for rejected files | Custom modal or overlay component | `shadcn/ui` Sonner toast | Handles dismiss timing, stacking, accessibility (aria-live) |
| Card, Button, Badge UI primitives | Custom CSS components | `shadcn/ui` | Handles focus states, keyboard accessibility, dark mode |
| Icon set | SVG files | `lucide-react` (ships with shadcn/ui) | Consistent weight and size |
| CSS utility classes | Custom CSS | Tailwind CSS v4 | Dark mode, responsive, consistent spacing |

**Key insight:** The drag-and-drop system IS hand-rolled — but only the validation and state logic. The event listener itself (`onDragDropEvent`) is Tauri's API. The visual feedback (classes on the card) is Tailwind. Do not reach for a drag-and-drop library (like react-dropzone) — it uses HTML5 drag events and won't give file paths.

---

## Common Pitfalls

### Pitfall 1: react-dropzone or HTML5 drag events give no file path

**What goes wrong:** You use `react-dropzone` (or native `onDrop` HTML event) expecting file paths, but in a browser context you only receive `File` objects. The OS path is not exposed by browsers for security reasons.

**Why it happens:** Tauri apps render in a WebView. JavaScript's File API intentionally hides file system paths. Only Tauri's native event bridge (`onDragDropEvent`) exposes the real OS path.

**How to avoid:** Always use `getCurrentWebview().onDragDropEvent()` for file-drop-from-OS scenarios. Never reach for `react-dropzone`.

**Warning signs:** `file.path` is undefined; `file.name` only has the filename, not the full path.

---

### Pitfall 2: `dragDropEnabled` naming is inverted / confusing

**What goes wrong:** Developer reads the flag, assumes `dragDropEnabled: false` disables drag-drop and `true` enables it. Actually, `true` means "Tauri's drag-drop intercept is active (HTML5 DOM drag events suppressed)".

**Why it happens:** The flag name is misleading. Official GitHub issue #14373 acknowledges this. When `true` (default): Tauri's `onDragDropEvent` works; HTML5 drag events on DOM elements are intercepted and suppressed. When `false`: standard browser HTML5 drag events work; Tauri's `onDragDropEvent` does not fire.

**How to avoid:** Leave `dragDropEnabled` at its default (`true`). Use only `onDragDropEvent` for file drops.

**Warning signs:** `onDragDropEvent` never fires, OR HTML5 drag-and-drop on internal UI elements is broken.

---

### Pitfall 3: Missing `dialog:allow-open` capability

**What goes wrong:** `open()` from `@tauri-apps/plugin-dialog` throws a permissions error or returns silently without showing a dialog.

**Why it happens:** Tauri 2's security model blocks all plugin commands by default. You must explicitly allow them in `src-tauri/capabilities/*.json`.

**How to avoid:** Immediately after running `npm run tauri add dialog`, add `"dialog:allow-open"` to the permissions array in `src-tauri/capabilities/default.json`.

**Warning signs:** Dialog never appears; console shows a Tauri IPC permissions error.

---

### Pitfall 4: `minWidth` without `minHeight` has no effect

**What goes wrong:** You set `minWidth: 600` in tauri.conf.json but the window can be resized smaller.

**Why it happens:** Tauri 2 known issue — `minWidth` requires `minHeight` to be set simultaneously to take effect.

**How to avoid:** Always set both `minWidth` and `minHeight` together.

**Warning signs:** Window resizes below intended minimum despite config.

---

### Pitfall 5: Drag-drop paths array corruption on Windows (sporadic)

**What goes wrong:** On Windows, after certain `cargo update` runs, `event.payload.paths` may contain corrupted path strings.

**Why it happens:** Known Tauri bug (#13698, reported 2024-2025). Cause is a Wry WebView layer change on Windows.

**How to avoid:** Validate the path string before using it: check it does not contain null bytes, check the extension, check the path length is reasonable. Log and reject if validation fails. This is a defensive measure — the bug is not consistent.

**Warning signs:** Extension check passes but `fs.readFile()` or Tauri FS command fails on a path that looks valid.

---

## Code Examples

### Complete File Drop Hook

```typescript
// src/hooks/useFileDrop.ts
// Source: https://v2.tauri.app/reference/javascript/api/namespacewebview/
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useEffect, useRef, useState } from 'react';
import { isSupportedFile } from '@/lib/fileValidation';

export type DragState = 'idle' | 'over-valid' | 'over-invalid';

export function useFileDrop(onFileDrop: (path: string) => void) {
  const [dragState, setDragState] = useState<DragState>('idle');
  const onFileDropRef = useRef(onFileDrop);

  useEffect(() => {
    onFileDropRef.current = onFileDrop;
  }, [onFileDrop]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        const { type } = event.payload;

        if (type === 'enter') {
          const paths = (event.payload as { paths: string[] }).paths ?? [];
          const valid = paths.length === 1 && isSupportedFile(paths[0]);
          setDragState(valid ? 'over-valid' : 'over-invalid');

        } else if (type === 'drop') {
          const paths = (event.payload as { paths: string[] }).paths ?? [];
          setDragState('idle');
          if (paths.length === 1 && isSupportedFile(paths[0])) {
            onFileDropRef.current(paths[0]);
          }

        } else {
          // 'over' (position update) or 'leave' / cancelled
          if (type !== 'over') setDragState('idle');
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, []);

  return dragState;
}
```

### File Validation Utility

```typescript
// src/lib/fileValidation.ts
const SUPPORTED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

export function getExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() ?? '';
}

export function isSupportedFile(filePath: string): boolean {
  const ext = getExtension(filePath);
  // Basic sanity check for path corruption
  if (!filePath || filePath.length > 4096 || filePath.includes('\0')) {
    return false;
  }
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function detectFormat(filePath: string): 'pdf' | 'image' | null {
  const ext = getExtension(filePath);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image';
  return null;
}
```

### File Picker Hook

```typescript
// src/hooks/useFileOpen.ts
// Source: https://v2.tauri.app/plugin/dialog/
import { open } from '@tauri-apps/plugin-dialog';
import { isSupportedFile } from '@/lib/fileValidation';

export async function openFilePicker(): Promise<string | null> {
  const result = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Supported Files',
        extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      },
    ],
  });

  if (typeof result === 'string' && isSupportedFile(result)) {
    return result;
  }
  return null;
}
```

### Tailwind Card Drag State Animation

```typescript
// Tailwind class logic for LandingCard.tsx
// dragState comes from useFileDrop hook
function cardClassName(dragState: DragState): string {
  const base = 'rounded-2xl border bg-card shadow-lg transition-all duration-200';
  if (dragState === 'over-valid') {
    return `${base} border-primary/70 bg-primary/5 shadow-primary/20 shadow-xl scale-[1.01]`;
  }
  if (dragState === 'over-invalid') {
    return `${base} border-destructive/50 bg-destructive/5`;
  }
  return `${base} border-border`;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri 1.x `fileDrop` events | Tauri 2.x `onDragDropEvent` with `type` payload | Tauri 2.0 (Oct 2024) | New event names, enum variants renamed |
| `tauri.windows.fileDropEnabled` | `app.windows.dragDropEnabled` | Tauri 2.0 | Config path changed |
| `@tauri-apps/api/dialog` (v1) | `@tauri-apps/plugin-dialog` (v2) | Tauri 2.0 | Separate npm package now; requires `tauri add dialog` |
| Tailwind v3 (PostCSS + config file) | Tailwind v4 (Vite plugin, no config file) | Tailwind v4 (Jan 2025) | `npm install @tailwindcss/vite`, single `@import "tailwindcss"` in CSS |
| `npx shadcn-ui@latest init` | `npx shadcn@latest init` | shadcn/ui 2024 | Package renamed to `shadcn` |

**Deprecated / outdated:**

- `@tauri-apps/api/dialog`: Moved to `@tauri-apps/plugin-dialog` in Tauri 2. Do not import from the old path.
- `tauri.conf.json > tauri > windows > fileDropEnabled`: Renamed to `app > windows > dragDropEnabled` in Tauri 2.
- `tailwind.config.js`: Not needed in Tailwind v4. If you see it in examples, those examples are for v3.
- `postcss.config.js` with `tailwindcss` plugin: Not needed in Tailwind v4 + Vite setup.

---

## Open Questions

1. **`onDragDropEvent` `enter` event payload: does `paths` exist on `enter` or only on `drop`?**
   - What we know: Official docs confirm `paths` is on the `drop` payload. The `enter` event payload structure for mid-drag validation (green/red signal) is less clearly documented.
   - What's unclear: Whether `paths` array is available on the `enter` event to validate file types before drop.
   - Recommendation: Test in the Tauri dev environment on first scaffold. If `paths` is not available on `enter`, validate extension at `drop` time and show a neutral indicator during drag (not green/red). The user decision about mid-drag validation is locked — but implementation may require a small adjustment based on what Tauri exposes.

2. **shadcn/ui with Tauri: CSS variable injection and WebView rendering**
   - What we know: shadcn/ui uses CSS custom properties for theming. Tauri renders a native WebView.
   - What's unclear: Whether any WebView-specific font rendering or CSS variable quirks exist on macOS/Windows.
   - Recommendation: LOW risk. Set `font-family` explicitly in globals.css. Test on macOS first (primary target).

---

## Sources

### Primary (HIGH confidence)
- `https://v2.tauri.app/plugin/dialog/` — Dialog plugin setup, `open()` API, filters, permissions
- `https://v2.tauri.app/reference/javascript/dialog/` — `OpenDialogOptions` full type definition
- `https://v2.tauri.app/reference/javascript/api/namespacewebview/` — `onDragDropEvent` API, payload structure
- `https://v2.tauri.app/security/capabilities/` — Capabilities JSON file format and permission strings
- `https://v2.tauri.app/reference/config/` — Window config: `width`, `height`, `minWidth`, `minHeight`, `center`, `dragDropEnabled`
- `https://v2.tauri.app/start/create-project/` — Scaffold with `npm create tauri-app@latest`, `react-ts` template
- `https://tailwindcss.com/docs/guides/vite` — Tailwind v4 Vite installation (official)
- `https://ui.shadcn.com/docs/installation/vite` — shadcn/ui Vite + TypeScript setup (official)

### Secondary (MEDIUM confidence)
- `https://github.com/tauri-apps/tauri/issues/14373` — `dragDropEnabled` naming confusion; verified two-system architecture
- WebSearch results for Tauri 2 drag-drop patterns, cross-verified with official webview API docs

### Tertiary (LOW confidence)
- `https://github.com/tauri-apps/tauri/issues/13698` — Windows path corruption bug in `onDragDropEvent` — single issue report, platform-specific, not consistently reproducible

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official Tauri 2 docs, official Tailwind docs, official shadcn docs
- Architecture: HIGH — patterns derived directly from official API examples
- Pitfalls: HIGH for items 1-4 (multiple sources, official GitHub issues); LOW for item 5 (single bug report, platform-specific)
- Open questions: MEDIUM — edge cases needing runtime validation

**Research date:** 2026-02-19
**Valid until:** 2026-08-19 (Tauri 2.x is stable; Tailwind v4 recently released — check for minor API changes if significantly delayed)
