# HAG RUN development baseline

Date: 2026-10-27

## Source and deployment

- Public repository: `henriquehag1/pre-consulta-hag`, default branch `main`.
- Baseline commit: `e70179df1dacbbabe2ca5268077254782afd2c07`, dated 2026-10-23.
- The published GitHub Pages `treino_HAG.html?vitrine=1` returned the same SHA-256 as the repository file: `a462a43491348330ed8dbb41b4efc4ddd29abc810f7e31a14d87f88a8279c632`.
- An isolated clone is in `HAG_RUN_dev`, on local branch `codex/hag-run-discovery`, based on the published `main` commit. The production branch and remote have not been modified.
- No `treino_HAG.html` or HAG Treino Git checkout was found in the local `Profissional/HAG_Consultas` source tree. The local HAG OS folder is not a Git repository. No patient records were inspected.

## Dependencies and integration

- The application is a static HTML/CSS/JavaScript page, with CSS and JavaScript embedded in `treino_HAG.html`.
- It uses Supabase REST RPC calls from the browser. Functions named in the page include `hag_treino_contexto`, `hag_treino_contexto_ver`, `hag_treino_vitrine`, and `hag_treino_salvar`.
- The page describes `hag_treino_contexto` and `hag_treino_salvar` as token-scoped endpoints. The program catalog is supplied by the context RPC rather than a checked-in catalog file.
- `hag_auth.js` provides the shared authentication integration. The page and `treino_painel_HAG.html` are related entry points.
- No package manifest or build system is present in the repository. The page currently has no external JavaScript runtime dependency declaration.
- Database tables, deployed function definitions, and live policies have not been independently verified. This checkout contains no HAG Treino migrations; inspection of database state requires an authenticated, read-only Supabase connection.

## Confirmed code observation

- In `treino_HAG.html`, the readiness result for severe joint pain currently says to follow the plan and only to notify the office if pain persists. This is inconsistent with a stop and professional assessment threshold and should be corrected before this module is used as a running safety signal.
- Catalog frequency/session discrepancies and per-session prescription contents cannot be established from the public HTML alone because the actual catalog arrives from Supabase. They remain unverified until a sanitized export or read-only database access is available.

## Safety and rollback

- Do not run migrations or issue writes to Supabase from this development checkout.
- Keep all edits and commits on `codex/hag-run-discovery`; do not push or deploy without review and explicit approval.
- Rollback of local code changes: switch to `main` or discard this development clone. The baseline is preserved by commit `e70179d`; production is untouched.
- The prior GitHub 403 is not reproducible from the available evidence. Anonymous read access works. A remote branch push requires an authenticated GitHub identity with write access to this repository. No push has been attempted.

## Next audit requirements

1. Obtain a read-only, sanitized export of the HAG Treino catalog and function/table definitions.
2. Map all 42 programs and actual sessions to their configured weekly frequency and available sessions.
3. Reproduce the reported schedule and session ID issues against the export.
4. Build the Rumo aos 5 km deterministic engine locally, with explicit eligibility and progression rules, then run the requested profile and conversion tests.
5. Review the engine and patient-facing safety language before any integration or release.
