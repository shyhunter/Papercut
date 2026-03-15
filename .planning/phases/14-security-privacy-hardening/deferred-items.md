# Deferred Items — Phase 14

## Pre-existing Test Failures

1. `src/lib/__tests__/fileValidation.test.ts` — "rejects unsupported file: report.docx" fails because Phase 13 added `docx` as a supported format but did not update this test.
2. `src/lib/__tests__/fileValidation.test.ts` — "returns null for unsupported extensions" fails because `detectFormat('document.docx')` now returns `'document'` (added in Phase 13) but the test expects `null`.

These are not caused by Phase 14 changes and should be fixed in a separate cleanup pass.
