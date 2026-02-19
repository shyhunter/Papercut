# Papercut — Project Rules & Decisions

Managed via `/rules-manager` skill. See global rules in `~/.claude/rules.md`.

---

## Legend

| Field | Values |
|---|---|
| **Scope** | `project` |
| **Category** | `Workflow` · `Tooling` · `Code Style` · `Architecture` · `Communication` |
| **Status** | `active` · `deprecated` |

---

## Rules & Decisions

| ID | Category | Date | Rule | Reason | Expected Result | Example | Status |
|---|---|---|---|---|---|---|---|
| P001 | Architecture | 2026-02-19 | Use Tauri + TypeScript + React as the app shell | Lightweight bundle (~10MB vs Electron's 150MB+), suitable for a local utility app | Small distributable, native feel | `tauri build` produces a small native binary | active |
| P002 | Tooling | 2026-02-19 | Use Sharp for image resizing/compression | Best-in-class Node.js image processing library | High-quality image output across all resize modes | `sharp(input).resize(800).toFile(output)` | active |
| P003 | Tooling | 2026-02-19 | Use pdf-lib for PDF page resizing and reformatting | Mature JS library, no binary dependency needed | PDF page resize without external tools | `PDFDocument.load()` → scale pages → `save()` | active |
| P004 | Tooling | 2026-02-19 | Use docx library for DOCX manipulation | Most mature Node.js option for Word documents | DOCX resize/reformat without Office dependency | `new Document({...})` to rebuild with new dimensions | active |
| P005 | Workflow | 2026-02-19 | Use GSD for planning phases; review all plans before execution (no yolo mode) | Pragmatic approach — GSD for structure, human gates for production safety | Plans are reviewed and approved before any code is written | Run `/gsd:plan-phase`, read the plan, then approve before `/gsd:execute-phase` | active |
| P006 | Architecture | 2026-02-19 | DOCX resize is limited — scope carefully per milestone | No ecosystem handles all DOCX operations perfectly | Avoid over-promising on DOCX features | Start with page size change only; compression and crop are v2 | active |

---

## How to Add a Rule

Run `/rules-manager` and follow the prompts.
