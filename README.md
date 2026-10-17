# Ward Evidence · Tyks × Mylab

React/TypeScript microbiology workspace using Vite, React Router, TanStack Query,
Zod, Radix Dialog and the existing CSS-token design system.

## Deploy on Render

Use this repository's `render.yaml` for the free static site. Set `VITE_API_BASE_URL`
to the backend's public HTTPS URL including `/api/v1`; set the backend's
`AEI_CORS_ORIGINS` to this site's actual origin. The Blueprint enables the public
hosted batch button and SPA routing. API URLs are public; OpenAI keys, database
credentials and feed tokens belong only in backend secrets.

With `VITE_HOSTED_DEMO=1`, controls use `/api/v1/demo` on the backend and need no local
launcher. Viewing, AI summaries and batch controls need no password. The backend's
`DEPLOYMENT.md` covers creating PostgreSQL and importing/preparing the demo once.
Free Render backends can take about a minute to wake up; their free databases expire
after 30 days. Build again after changing Vite environment variables.

## Run

After pulling changes, run `npm ci` before starting the frontend. The redesigned
app imports the bundled Barlow font packages; missing packages can make Vite return
HTTP 500 for `src/main.tsx` and leave a blank page. For the integrated live demo,
use the sibling backend's `DEMO.md` and its existing `scripts/start-demo.ps1`
launcher; it supplies the API URL and server-side demo-control proxy configuration.

```powershell
npm ci
npm run dev -- --port 5173
```

Open <http://127.0.0.1:5173/ward>. Node 22.12+ or 24 is recommended.
API mode is the default. Start the sibling backend on port 8000 with the validated
synthetic dataset imported into PostgreSQL; follow its README. Vite proxies
`/api/v1` to that server. No real hospital connection is implied.

`.env.example` uses `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=/api/v1`.
An existing `.env.local` can override these. Restart Vite after environment changes.
API errors never switch to mock data. Explicit `VITE_DATA_MODE=fixtures` remains
available for isolated interface testing and is visibly labeled as authored examples.

## Manual live-feed demonstration

From the sibling backend repository, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

This launches PostgreSQL, the backend and this frontend with an isolated synthetic
dataset. Open **Demo feed** in the header, then press **Send next lab batch**. One batch travels through
the real HTTP feed; the button is disabled until publication finishes, and the existing
SSE connection refreshes the dashboard. There are no automatic deliveries. The trend
retains its separate 30-second refresh limit. Use **Use latest date** to follow arrivals.

The panel appears only when the launcher sets `VITE_DEMO_CONTROLS=1`. Vite proxies
`/__demo` to the loopback controller using server-only `DEMO_CONTROL_URL` and
`DEMO_CONTROL_TOKEN`; the browser receives no feed credential. Ordinary startup
does not include these controls. Ctrl+C stops the launcher and its servers; relaunch
resumes, and `-Restart` creates a fresh demo run. See the backend's `DEMO.md`.

## Report summary panel

In API mode, **AI summary** at the top of the overview opens a separate side panel.
Inside it, **Summarize this report** requests an explanation of the saved evidence
currently displayed. Opening the drawer alone does not call the AI provider. The panel uses `/api/v1/ai/summaries`, polls pending work, and
labels the result **AI-assisted summary** or **Basic summary** according to the
backend. Applicable limitations remain visible, supporting facts expand below the
paragraph, and **View evidence** opens the matching report's provenance.

Closing and reopening the drawer reuses the same report-bound job and result in
the query cache. Generation is explicit. A new analysis clears the old panel and offers
**Summarize updated report**; late responses cannot attach to another analysis.
During revision refresh, a retained summary is labelled as belonging to an older
report. Errors stay in this panel. Pending polling pauses after two minutes and
offers **Check status**. No provider credentials or model calls belong in the browser.
Configure the provider on the backend as described in its `AI_SUMMARY.md`.

## Design and quick access

The UI uses steel-blue colors, locally bundled Barlow fonts, sticky top
navigation, shared evidence cards and side drawers.
Alerts, demo controls, live updates and optional AI use the same design system.
See `design-system/MASTER.md` for details and supported-data differences.

Ward Overview starts with a compact **Current query** summary and the report date,
followed by the evidence. **Edit query** expands the existing ward, organism,
specimen, antibiotic and population filters in place. **Apply cohort** applies the
selection and closes the editor; **Cancel** discards unapplied changes. Active sex,
age and isolate-selection restrictions remain visible when the editor is closed.
Favorites, recent queries and remembered default queries are not part of this flow.
Demo publishing lives in the header's **Demo feed** drawer and appears only in demo mode.

## Dates and overlapping overview periods

**Report end date** sets the inclusive endpoint of both headline periods and the
antibiotic comparison. Their exact bounds come from the backend.

For 27 September 2026:

| View           | Inclusive dates                     |
| -------------- | ----------------------------------- |
| Last 12 months | 28 September 2025–27 September 2026 |
| Last 28 days   | 31 August 2026–27 September 2026    |

The 12-month date range **includes** the recent 28 days. Each period independently
selects first isolates, so the two denominators cannot be added or subtracted to
construct a disjoint baseline. The frontend states the overlap next to the cards.

**Chart year** is inside the time chart and affects only that chart. A report end
date of 27 September 2026 with chart year 2025 leaves the headline periods above
unchanged and requests month-end cutoffs from January–December 2025 for the graph.
If the selected year contains the report date, later cutoffs are excluded and the
current partial month ends on the report date.

There is no calendar-year susceptibility endpoint. The annual card and placeholder
have been removed; the overview has two equal-width cards. The chart appears below
the visible antibiotic-comparison panel.

## Pages

- `/ward`: report date, cohort controls, the two overlapping headline periods,
  antibiotic comparison, then susceptibility over time. Counts/uncertainty expand.
- `/investigate`: the selected cohort's evidence, counts, uncertainty, paired
  comparison and saved snapshot exports.
- `/alerts`: real backend resistance monitoring and active alert links. Monitored
  populations are configured by the backend, independently of ward-screen filters.
  A historical report date hides current alerts until the user chooses the latest
  monitoring date. Empty, sparse, unavailable and below-threshold states differ.
- `/investigate/:investigationId`: real resistance investigation in API mode, with
  separately selectable current evaluation and original detection. Archived-run
  investigations preserve their original evidence. Explicit fixture mode retains
  its earlier authored detection scenario for regression tests.
- Patient history remains an accessible drawer: real string ID lookup, all prior
  specimen types, strict cutoff, cursor pagination and per-page saved exports.

URL state preserves the cohort and reporting cutoff. **Use latest date** exits a
historical/pinned report. The first-isolate policy matches the backend's
`selected_cohort` default, with an explicit `all_wards` advanced option.

## Resistance monitoring and its separate baseline

The latest backend (`78ebcd9`) implements `/api/v1/alerts` and
`/api/v1/investigations/{id}` with `alert-v1` saved analyses.

Unlike the overview's overlapping rolling periods, resistance detection compares
recent 28 days against a **preceding non-overlapping 12-month baseline**. For
27 September 2026 the recent interval is `[2026-08-31, 2026-09-28)` and the baseline
is `[2025-08-31, 2026-08-31)`. The default proposed trigger is a resistance increase
of at least 10 percentage points, with 30 tested isolates required in each period.
The backend supplies all values, statuses and counts; React does not detect alerts.

The screen distinguishes new, ongoing, cleared and insufficient-evidence states.
A low-count evaluation never implies clearance. Original/current snapshots have
separate analysis IDs and exports. Context includes population counts, source
coverage, shared patients and lifecycle history. No confidence intervals are
invented for alert windows: that backend contract does not supply them.

Current and original results are separately labeled; after reset an old investigation
has no substituted current-run result. Monitor exports/downloads always request
the displayed saved analysis ID. A threshold is a proposed review heuristic,
not an outbreak, causal or significance claim.

## Susceptibility over time

The chart loads automatically on opening the overview and after cohort, explicit
report date or chart year changes. Live revisions refresh it at most once every
30 seconds; the latest revision at that fixed deadline is used. **Refresh now**
can update it sooner. Snapshot cutoff/revision and waiting/loading status are
displayed. Changing comparison B or its period does not reload the chart.
The backend still has no true monthly-aggregate/series endpoint. The chart
requests its 28-day evidence at month-end cutoffs for the chart year. These
are rolling estimates sampled monthly, not complete calendar-month aggregates. The chart labels
susceptibility (%) and the 28-day period end, identifies the antibiotic and shows
how many cutoffs have reportable estimates. Missing estimates stay off the plotted
line and appear as dashes in a separate availability row. Focus, hover or select a
month to see its exact date, tested/eligible counts and reporting status. Low support,
no tests, no eligible isolates and non-applicability remain distinct, including in
the expanded table. Axis labels stay visible while the month strip scrolls on mobile.
One historical request runs at a time; all results must share one run/revision. Sparse
or unavailable percentages are gaps. An expandable table retains counts, supplied
intervals and each point's frozen export. Historical cutoffs use the current published
isolate revisions, not a claim about when results became known.
Superseded series are cancelled immediately so remaining cutoffs do not queue
behind new publications. The previous complete chart stays visible during refresh,
with its own snapshot label. A new population/year/run clears that chart.

## Refresh failures and coverage

Background state or metadata failures retain the workspace when validated data
already exists. An inline **Retry refresh** notice marks it as potentially out of
date. A failed initial load still shows the full error state.

Analysis refreshes retain only exact population/date/cursor/method/run matches.
An active view holds its last successful snapshot even if an older query revision
is garbage-collected. Retry errors remain visible beside those results; changing
population, date or run never substitutes another population's data. Exports keep
the original displayed analysis ID.

Comparison validation preserves the backend's actual coverage and maps it into
snapshot provenance. Imported-date-span coverage, dataset import completeness and
feed inclusion are separately labeled. Missing comparison coverage is rejected
instead of manufacturing an incomplete-source warning.

## Live feed integration

Backend `42b881a` adds durable external-feed publication and `/api/v1/updates`.
The frontend accepts `receiving` runs and preserves feed source, reporting clock
and digest in analysis context. Feed mode displays its source and whether dates
are simulated or UTC. Imported-dataset date bounds/hashes do not certify feed
completeness; snapshot details explain the distinction.

One EventSource per mounted dashboard coalesces notification bursts into a fresh
`/state` read. Notification payloads never replace active state directly, because
reconnects can replay old runs/revisions. Native reconnects retain Last-Event-ID.
State changes refresh dictionaries and revision-keyed analyses. Complete snapshots
can remain visible with an updating notice during a same-population revision
refresh; responses never cross changed filters, dates, history cursors or runs.
Polling falls back to every two seconds while disconnected, with a 30-second
backup while connected. The stream closes and queued work cancels on unmount.

Feed ingestion remains an operational backend API. No feed token is exposed to
the browser, and viewing this UI does not start or reset an ingestion run.
Top navigation **Investigate susceptibility** opens `/investigate`. Patient search uses
the verified supplied-data example `P000001` in its placeholder.

## Replay is a backend demonstration tool

Playback controls have been removed from normal navigation and drawers. They were
useful for demonstrating how incoming culture bundles change windows and alerts,
but are unnecessary for routine report browsing. The backend publishes by day
because the source has collection dates rather than real arrival timestamps.
Historical report dates can be selected directly without playing a simulation.

The backend replay API and test client remain available for developers. Starting,
stepping or resetting affects the shared active run; it is not merely an animation.
The local supplied-data preview was returned to its completed 27 September 2026
state when playback was removed. Source records and saved analyses were preserved.

## Data and design boundaries

- `src/api/backend.ts`: validates published evidence/comparison/history/meta/state
  wire payloads and maps their names to existing UI view models.
- `src/api/alerts.ts`: current resistance-monitoring and investigation schemas;
  distinct from the old authored fixture investigation format.
- `src/api/client.ts`: guarded requests and exact saved-ID exports.
- `src/app/queries.ts`: snapshot-aware cache keys, cancellation, state polling and
  bounded recovery. Monitoring revisions may lag control-only state revisions.
- `src/styles/tokens.css`, `src/components/`, `design-system/MASTER.md`: shared visual
  system. Extend these rather than adding another theme or framework.

No susceptibility, paired statistic, interval, alert rule or calendar aggregate is
calculated by feature components. Backend schemas are hand-maintained against the
current source, not generated from OpenAPI. Below 30 tests, estimates remain null.
Missing tests never imply resistance. Date-only formatting avoids timezone drift.

## Validation

```powershell
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npx playwright test --config playwright.api.config.ts
node scripts/capture.mjs
```

The normal suite runs an explicit fixture server on port 4173. The API suite uses
the real published backend via port 5173 and compares displayed values to responses.
It also checks chart-year independence, report/date bounds, resistance monitors,
saved exports, and desktop/mobile accessibility and overflow.

An additional API test is opt-in through `AEI_ALERT_TEST_URL` pointing to a separate,
explicitly authored backend alert scenario. It resets/steps only that scenario API,
checks original versus insufficient current evidence, and validates archived exports.
Never set this variable to the supplied-data preview. The local scenario test API
used port 8001 and PostgreSQL schema `aei_frontend_alert_check`, separate from the
main preview's `aei` schema. Backend `.data/frontend_alert_app.py` and
`.data/frontend-alert-check.py` are ignored local helpers, not production source.

Set `AEI_FEED_TEST_BATCH` as well to enable the actual SSE publication test. It
points to an authored delivery JSON generated by ignored backend helper
`.data/frontend-feed-payload.py` using `culture_bundles`/`batches` and
`model_dump_json(by_alias=True)`. The test starts a simulated receiving run only
on `AEI_ALERT_TEST_URL`, publishes the test bundle and verifies automatic refresh
and frozen exports. Its native stream redirects to port 8001; allow the preview
origin in that scenario server's `AEI_CORS_ORIGINS`.

The local validation cluster is PostgreSQL 17 in
`../TyksXMylab-backend/.data/frontend-check-pg`, loopback port 55433. Main Uvicorn
uses `AEI_DATABASE_URL=postgresql://aei@127.0.0.1:55433/aei`. The backend README's
standard Docker setup instead uses port 55432. No backend source was edited.

Screenshots are ignored in `test-results/`; the capture script expects API mode
and a running backend/Vite preview. Direct Chromium Playwright scripts are used
because `playwright-interactive` is not installed. Production authentication,
connecting a real hospital feed, Flink, localization, shared saved queries and adjusted analyses
remain outside this frontend.

Redesign verification adds saved-query restoration and error handling, an optional
AI drawer with cached reopening, alert tabs with exact snapshot exports, and
1185px/768px/390px screenshot and accessibility checks. The browser-only component
harness is excluded from the production entry. No backend source was edited.
