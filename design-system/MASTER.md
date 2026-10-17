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

Ward: explicit fixture notice → heading/date/export → applied cohort form → three
window cards → paired comparison beside review flags → replay strip/provenance.
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
