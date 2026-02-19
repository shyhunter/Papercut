# Coding Conventions

**Analysis Date:** 2026-02-19

## Status

**No source code detected in this repository.** This is a GSD planning repository for the Papercut project. The actual application source code does not yet exist in this directory.

## Expected Stack

Based on `.claude/CLAUDE.md`, the Papercut project will use:

- **Language:** TypeScript
- **App shell:** Tauri + React
- **Build tool:** Unknown (likely Tauri's build system)

## Expected Conventions (Based on Project Description)

When source code is created, the following conventions should be established:

**Files:**
- Component files: `[ComponentName].tsx` (React components)
- Type files: `types.ts` or `[feature].types.ts`
- Utility files: `utils.ts` or named utilities like `imageProcessor.ts`
- Services: `[serviceName].ts` (e.g., `documentService.ts`)

**Functions:**
- Likely camelCase for JavaScript/TypeScript functions
- PascalCase for React components

**Variables:**
- Expected: camelCase for variables and constants
- Constants: UPPER_SNAKE_CASE

**Types:**
- Expected: PascalCase for TypeScript types and interfaces

## Code Style

**Formatting:**
- Tool: Not yet specified
- Consider: Prettier for consistency

**Linting:**
- Tool: Not yet specified
- Consider: ESLint with TypeScript support

## Import Organization

**Expected order:**
1. React and external dependencies
2. Type definitions
3. Local utilities and components
4. Relative imports

**Path Aliases:**
- Not yet configured

## Error Handling

**Patterns:**
- Expected: Typed error handling (avoid `any`)
- See CONCERNS.md for known issues

## Logging

**Framework:** Not yet specified

**Patterns:**
- Expected: Consistent logging across services
- Consider: Console API or logging library like `winston` or `pino`

## Comments

**When to Comment:**
- Document why, not what (code should be self-documenting)
- Complex business logic requires explanation
- Integration points with Sharp, pdf-lib, and docx library

**JSDoc/TSDoc:**
- Expected: Document public APIs
- Return types should be explicit

## Function Design

**Size:** Expected: Keep functions focused and small

**Parameters:** Expected: Use objects for multiple parameters

**Return Values:** Expected: Explicit return types in TypeScript

## Module Design

**Exports:** Expected: Named exports over default exports

**Barrel Files:** Expected: Use index.ts for module organization

---

*Convention analysis: 2026-02-19*
*Note: This analysis reflects a planning-stage project. Update once source code is created.*
