# Ward Evidence design system

## Direction and reference interpretation

A quiet clinical research workspace: a light lavender-grey canvas, white surfaces,
a narrow white navigation column, generous space around dense evidence, restrained
violet accents and fine outlined icons. The two supplied dashboard images guide
composition, spacing and hierarchy. Their metrics and decorative charts are not
part of this product. Use the implementation plans for actual content.

The frontend was empty before implementation. This is its single shared system,
not a second library. React + semantic HTML + CSS custom properties follow the
frontend plan; Radix supplies modal focus behavior. No large dashboard framework.

## Foundations

- Primitive → semantic → component tokens live in `src/styles/tokens.css`.
- System sans-serif, 16px base; 11–14px supporting labels; 30px page titles;
  44px evidence values. Tabular numerals for all measurements.
- A 4px spacing rhythm, 24px panel padding and gaps, 32px workspace inset.
- White panels, 12px corners, subtle borders; shadows only for overlays.
- Violet is navigation/selection and evidence emphasis. Teal is a secondary data
  series. Amber indicates named review/support states, never treatment advice.
- 44px primary controls, compact secondary controls and visible violet focus rings;
  meaningful text accompanies color.

## Shared components

Button (primary, secondary, ghost), Select/Field, Badge, Panel, SectionHeading,
EmptyState, ErrorPanel, IntervalPlot, WindowCard and Drawer. Every feature composes
these primitives and consumes semantic tokens. No raw palette values in TSX.

## Page layouts

Ward: source notice → heading/report date → applied cohort form → two
window cards → visible paired comparison → automatically loaded susceptibility chart.
The highlighted period is a visual anchor, not a recommended treatment.

Investigation: back link/flag identity → exact population → recent versus baseline
evidence → descriptive composition or chronology, with adjacent context details.

## Responsive behavior

Desktop uses a 208px navigation rail. Below 1100px the rail reduces to 76px;
below 760px it becomes a compact top bar. Period cards, comparison and context
panels stack below 900px. Filters wrap into two columns, then one at 480px.
Tables may scroll inside labeled regions; the document must not scroll sideways.
Drawers fill mobile screens. This is an assumption because references are desktop only.

## Evidence behavior

Percentages/intervals are supplied by the API, never inferred from counts. All five
support states have named messages. Intervals share a fixed 0–100 axis and text
endpoints. All pages retain fixture/source/date/snapshot context. Export uses the
displayed analysis ID. No cosmetic trends, clinical recommendations or hidden fallbacks.

## Skills reviewed

The design, design-system, ui-styling and ui-ux-pro-max skills in
https://github.com/LeorickCoder/awesome-codex-skills informed token layers,
component composition, accessible interactions and responsive review. Local
ui-ux-pro-max search returned applicable minimal/data-dense style guidance but
irrelevant marketing page patterns; those patterns were discarded in favor of the
user's screenshots and project plan.

## Readability and API integration update — 17 October 2026

The existing tokens and components remain the single system. Main supporting text
now uses 13–14px where practical. Headline evidence emphasizes the estimate and
sample size; detailed counts and uncertainty open on demand.

Ward order: heading and direct investigation action → cohort/report controls →
Last 12 months → Last 28 days → visible antibiotic comparison → automatically loaded monthly-cutoff trend.
Unsupported annual aggregates have no card or placeholder. Real backend resistance
monitoring has its own sidebar page.

Navigation names the actual task: **Investigate susceptibility** goes directly to
`/investigate`. The investigation page uses the selected cohort's real evidence
and paired comparison. It does not imply an automatic resistance alert exists.

Replay controls are absent from routine pages and drawers. Historical report dates
can be selected directly. Backend replay remains a development/demo API.

The trend uses API-provided 28-day estimates at month-end cutoffs. Suppressed
points are gaps; exact values/counts/intervals and per-point exports are available
in an expandable table. No fabricated smoothing, extrapolation or monthly average.

## Period semantics and monitoring update — 17 October 2026

Remove unsupported calendar-year cards completely. The overview uses two equal
columns, Last 12 months then Last 28 days; stack them on narrow screens. Label their
time overlap directly. The rolling-year overview is not an alert's disjoint baseline.

Report end date is the single date control above the cohort. Its helper names both
headline periods. Chart year lives only inside the time-chart panel, with a helper
stating the report end date stays unchanged. Visible antibiotic comparison precedes
the time chart. Playback is absent from routine navigation and overlays.

Resistance alerts are an explicit sidebar destination. The monitoring page names
its configured populations, support states and current monitoring date. Investigation
uses separate Current evaluation / Original detection selectors and exact saved-ID
exports. An archived investigation cannot borrow a current-run result. Descriptive
composition tables expand on demand; raw organism-mixture counts have a separate
population. Do not invent interval graphics for alert payloads without intervals.

## Automatic chart and live publications

The time chart loads on entry and reloads with the selected report/cohort/year.
Use the shared loading/error states; retain complete same-population snapshots
during revision refresh with an updating notice. Background failures show an inline
retry notice alongside the last valid view. Initial failure without data keeps the
full error state. Coverage badges use actual backend flags and their semantic tone.
The horizontally scrolling chart
region is named, keyboard-focusable and uses the existing focus-ring token.

Navigation says **Investigate susceptibility**. Patient search shows the verified
supplied-data example **P000001**. Feed mode names its source, reporting clock and
update connection. Imported dataset dates/coverage remain separate from feed
completeness; do not imply a live feed is complete from seed manifest statistics.

The chart's first load is automatic. Live revisions are limited to one series start
per 30 seconds, with a supplemental Refresh now action, one request at a time and
immediate cancellation of superseded work. Label the displayed cutoff/revision;
keep the complete previous chart during updates. Wrap chart header controls on
mobile rather than squeezing its title. No manual ingestion controls are added.
