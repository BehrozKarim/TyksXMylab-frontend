# Ward Evidence · Tyks × Mylab

A responsive microbiology evidence workspace built with React, TypeScript, Vite,
React Router, TanStack Query and a shared CSS-token design system.

## Run locally

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173. Node 22.12+ or 24 is recommended.

The default mode is **fixtures**, clearly labeled in the application. The
deterministic MSW responses are authored interface examples, not results from the
supplied CSVs. They support filtering, reporting dates, three evidence windows,
paired comparisons, patient history, investigations, replay and frozen exports.

## Implemented workflows

- `/ward`: applied cohort controls, URL/back/forward restoration, annual / rolling
  12-month / 28-day evidence, all five support states, source-coverage warnings,
  common-denominator comparisons, patient history and review flags.
- `/investigate/:investigationId`: the flag's authoritative population, original
  detection snapshot, resistance intervals, count table, age composition and timeline.
- Shared accessible drawers for patient history and analysis provenance. CSV and
  JSON downloads request the **displayed analysis ID** and retain the original
  revision across replay and reset.
- Replay start, acknowledged pause, date step, reset, follow-clock / pinned dates,
  two-second state polling, cancellation and bounded stale-snapshot recovery.
- Desktop, tablet and mobile layouts, reduced motion, focus visibility and keyboard
  dialogs. Source/scenario labels remain visible.

## Backend integration boundary

The existing sibling backend currently exposes `/health`, `/events`,
`/events/batch`, `/isolates/{id}/history` and legacy `/statistics`. It does **not**
implement the additive `/api/v1` facade from the two implementation plans.

This frontend deliberately does not reinterpret legacy statistics or perform
scientific calculations. All percentages, confidence intervals, window bounds and
paired measures come from API-shaped responses. Runtime validation rejects legacy
payloads, inconsistent counts, leaked suppressed values and mismatched snapshots.

To connect once the facade is implemented, copy `.env.example` to `.env.local`:

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api/v1
```

Restart Vite. `/api/v1` is proxied to `http://127.0.0.1:8000`. API errors never
activate fixture fallback. In production, serve the API under that same prefix or
provide an absolute API URL with server CORS configured.

`src/api/contracts.ts` is the hand-maintained runtime/TypeScript contract. Evidence
and comparison follow the plans' explicit schema. Metadata, state, history and
investigation envelopes fill details not fully specified in the plans and must be
aligned with the backend's final OpenAPI before integration. Generate types from
that document when available. Real API smoke validation remains blocked by the
missing facade; the current validation exercises the explicit fixture service.

The investigation response separates `serving_context` (the current guarded
request state) from `analysis` (the original detection snapshot). Advancing replay
does not change the detection's analysis ID, values or revision. This envelope
also needs agreement with the backend before enabling API mode.

## Design system

See [design-system/MASTER.md](design-system/MASTER.md). The reference screenshots
informed the white panels, lavender canvas, slim navigation, violet focal card,
subtle borders and spacious evidence hierarchy. Their example metrics were replaced
with this project's data requirements. Mobile stacking is an explicit assumption
because only desktop references were supplied.

- `src/styles/tokens.css`: primitive, semantic and component tokens.
- `src/components`: shared controls, status handling, panels, modal and interval plot.
- `src/features`: page-specific compositions using those shared components.
- `src/api`: validated typed client; `src/app/queries.ts`: centralized query identity.
- `src/mocks`: authored MSW responses, kept outside feature components.

The frontend repository initially contained only its implementation plan and README;
there was no prior component system to migrate or reuse. This is the single system.

## Useful fixture paths

| Choice                                  | What it demonstrates                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| Default Urology / urine / E. coli / CIP | Available windows and a review flag                                |
| Intensive care / recent window          | 29 tested isolates; estimates hidden                               |
| Geriatrics                              | Eligible isolates with no recorded tests                           |
| Health centre North                     | Empty cohort                                                       |
| CIP versus MEC / recent window          | Standalone N≥30, paired N=26; comparison suppressed                |
| Calendar year 2023                      | Incomplete source coverage despite adequate sample size            |
| Pin 20 September 2026                   | Later monitoring flags hidden                                      |
| Patient P-00142                         | Prior urine, blood and wound cultures; cutoff-date sample excluded |
| Patient P-00187                         | Search match with no prior samples in the lookback period          |
| Step after 27 September                 | Clock-only advancement without new bundles                         |
| Step to 30 September                    | Authored sparse-window transition, not a scientific calculation    |

The authored review flag is part of the fixture scenario. It is never inferred by
a React component. Reset returns the demo to 20 September in a new run; previously
opened exports remain available within the browser session. Reloading fixture mode
restarts its in-memory service and clears those temporary analyses.

## Validation

```powershell
npm run build
npm run lint
npm run test
npx playwright install chromium
npm run test:e2e
node scripts/capture.mjs
```

Browser tests cover applied filters, date pinning, suppressed counts, paired support,
strict history cutoff, modal focus, authoritative investigation context, replay,
immutable exports, stale responses, API failures, incompatible legacy payloads,
mobile overflow and axe accessibility checks. Unit/component checks cover contract
invariants, the 29/30 boundary, URL normalization and date-only formatting.

Screenshots are generated in ignored `test-results/`; the Playwright report is in
ignored `playwright-report/`. `scripts/capture.mjs` expects Vite running at port 5173.
The requested `playwright-interactive` skill was not installed in this environment;
the same Chromium workflows were exercised directly through Playwright scripts.

P1 saved cohorts, Finnish localization and case-mix standardization are not part of
this implementation. No real patient or hospital-system integration is included.
