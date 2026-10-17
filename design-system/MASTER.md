# Ward Evidence design system

This document and `src/styles/` define the application's shared visual system.
React, semantic HTML and Radix Dialog provide the implementation. The application
is self-contained and does not require a separate design prototype or runtime.

## Foundations

- Barlow 400/500/700 for body, labels and strong text; Barlow Condensed 600 for
  headings, numbers, buttons and brand. Font files are bundled locally.
- Steel-blue accent `#5980a6`, canvas `#f2f2f3`, card `#fbfbfc`, ink `#1d1f20`.
  Attention states use a dark solid badge; quiet states use neutral or outline.
- Page headings 46px, section headings 28px, card headings 26px, hero values 84px.
- 16px card corners, 10px controls, 12px notices, 20px drawer corners.
- Hairline borders, subtle card shadows, generous divider-based grids.
- Primary button background uses `#416180` to meet AA contrast for small text.
  Blue outlines also use the darker text color.

`src/styles/tokens.css` contains palette and semantic tokens. Shared primitive
recipes live in `global.css`; application layouts and responsive rules live in
`workspace.css`. Existing tone names map into the same steel-blue palette.

## Layout and navigation

Sticky top navigation replaces the sidebar. It is one row at 1180px and above;
smaller widths put the horizontally scrollable navigation on a second row.
The content maximum is 1320px with 32px insets (18px on small screens).

Ward order: page actions → report date/cohort form → applied population → two
headline evidence periods → paired antibiotic comparison → susceptibility trend.
Primary filters share one divider grid, population filters expand underneath,
and reset/apply actions are grouped in the footer.

Evidence periods share a joint card. Comparison controls use three columns,
with bars and difference statistics below. The chart uses round points and a
2px line; missing evidence remains a gap. Tables and charts can scroll inside
labeled containers without making the document overflow.

Investigation has an evidence column and a context sidebar; it stacks below
960px. Alert investigations have Evidence overview, Population context and
Timeline and history tabs, with keyboard navigation. Current evaluation and
original detection remain independently selectable, exportable snapshots.

Drawers use the same 580px surface, header, close button and focus behavior.
Patient history, provenance, reading guidance, saved queries and AI summaries
all reuse it. Export success is announced in a 2600ms toast after a successful
export response, including while a drawer is open.

## Faster access and optional AI

**Saved queries** in the filter footer stores up to 12 named applied selections
in this browser. A saved query either follows the latest published date or keeps
an explicit report date. Restoration validates against the current dictionaries;
invalid selections are never silently substituted. No patient history or result
payloads are stored with a shortcut.

**AI summary** is a page action opening an optional drawer. Generation still
requires an explicit click. Closing and reopening reuses the report-bound job
and result in the query cache. A different analysis has its own summary; live
updates do not trigger generation. Supporting facts, interpretation limits and
matching evidence provenance remain available.

## Data and design boundaries

Copy, API contracts, calculation rules, query hooks and routes retain their
existing semantics. Design examples do not replace backend data.
In particular, alert responses do not contain confidence intervals, so alert
screens retain supported percentages/counts without invented interval plots.
The navigation alert count uses the backend's actual active alerts and is shown
only when monitoring is supported. Explicit fixture mode retains its existing
legacy alert scenario; it does not pretend to enable the backend alert API.

Demo controls, live-feed notices and summary fallback/error states extend this
same system. They do not introduce a separate palette or alter publication.
All five evidence support states retain named messages. Below 30 tested isolates,
percentages/intervals remain suppressed; missing tests never imply resistance.

## Verification

`tests/e2e/design.spec.ts` captures the main screen, support states and drawers
at 1185px and checks 768px/390px layouts. `design-components.spec.ts` checks the
real alert components and AI drawer with controlled responses, including focus,
keyboard tabs, suppression and saved-ID exports. Its separate browser harness
under `tests/browser/` is not imported into the production entry point.
The existing live-refresh, snapshot, failure and accessibility regressions remain.
Screenshots are local artifacts in ignored `test-results/`.
