# Handoff: Ward Evidence UI redesign (Tyks × Mylab)

Repo: `mabubakr1113/TyksXMylab-frontend` (React 19, Vite, TypeScript, TanStack Query, Radix Dialog, lucide-react, plain CSS in `src/styles/`).

Start with `PROMPT.md` (paste it into Claude Code), then use this file as the spec. `screenshots/00-contact-sheet.png` shows every state at a glance.

## 1. About the design files

Everything in `reference/` is an **HTML design prototype**. It shows the intended look, layout and behaviour. It is not production code and must not be copied into the repo. Recreate it in the repo's existing stack (React components, `src/styles/tokens.css`, `src/styles/global.css`, `src/components/ui.tsx`) using the repo's patterns.

- Fidelity: **high-fidelity**. Colors, type sizes, spacing, radii and states below are final. Match them to the pixel.
- Scope: **visual layer only**. Keep all data fetching, query keys, zod contracts, domain logic, routes, copy, accessible names and `aria-*` attributes exactly as they are. Existing tests in `src/test` and Playwright/axe tests must keep passing.
- Copy: all text in the prototype is taken from the repo. Do not rewrite it.
- The prototype's numbers are authored fixtures. Ignore the numbers; keep the repo's real data.

Source of truth when this document is ambiguous: `reference/Ward Evidence.dc.html`. Every style is inline on the element, so reading a section's markup gives its exact values. Open `reference/Ward Evidence.dc.html` in a browser to run it (it needs the sibling `support.js` and `_ds/` folder, both included). Preview props: `startPage` (ward, investigate, alerts, alert), `dataState` (ready, loading, error, stale), `feedMode` (true/false).

## 2. What changed (summary)

| Area | Before (repo) | After |
| --- | --- | --- |
| Palette | Violet/slate/teal/amber/rose | One steel-blue hue plus cool grays (section 4) |
| Type | System sans stack only | Barlow Condensed (headings, numbers, buttons) + Barlow (body) |
| Navigation | Left navigation (`--navigation-width: 208px`) | Sticky top bar with pill tabs |
| Surfaces | Panels on `#f5f5fa` | Off-white cards (`#fbfbfc`) on `#f2f2f3`, 16px radius, hairline border + soft shadow |
| Radii | 6 / 9 / 12 / 16 | 10 (controls), 12 (notices), 16 (cards), 20 (drawer), 999 (tags, pills) |
| Headings | Mixed | Large condensed headings, sentence-case 13px labels (no uppercase eyebrows) |
| Charts | Existing | Round points, 2px line, rounded interval bars |
| Status color | Semantic hues | Single hue: dark solid = needs attention, neutral/outline = quiet |

Verify the current navigation structure in `src/app/App.tsx` and `src/styles/global.css` before replacing it.

## 3. Fonts

| Role | Family | Weights used | Source |
| --- | --- | --- | --- |
| Headings, hero numbers, buttons, brand, table figures | **Barlow Condensed** | 600 (only) | Google Fonts or `@fontsource/barlow-condensed` |
| Body, labels, inputs, tables, captions | **Barlow** | 400 (body), 500 (labels), 700 (`<strong>`) | Google Fonts or `@fontsource/barlow` |

Fallback: `system-ui, sans-serif`.

```css
:root {
  --font-heading: "Barlow Condensed", system-ui, sans-serif;
  --font-body: "Barlow", system-ui, sans-serif;
}
```

Install (preferred, no external request):

```
npm i @fontsource/barlow @fontsource/barlow-condensed
```
```ts
// src/main.tsx
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/600.css';
```

Or via Google Fonts: `https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&family=Barlow+Condensed:wght@400;600&display=swap`

Rules: every `h1–h4`, button label, hero number, brand wordmark and table figure uses `--font-heading` at weight 600. Everything else uses `--font-body`. Use `font-variant-numeric: tabular-nums` on all hero percentages.

### Type scale (px / line-height / letter-spacing)

| Token | Size | Line | Tracking | Family, weight | Used for |
| --- | --- | --- | --- | --- | --- |
| display-hero | 84 | 0.90 | -0.03em | Heading 600 | 12-month / 28-day percentage on ward cards (the `%` suffix is 34px, accent color) |
| display-l | 64 | 0.95 | -0.025em | Heading 600 | Percentages on Investigate page |
| display-m | 60 | 0.95 | -0.025em | Heading 600 | Baseline / recent resistance on alert page |
| display-s | 44 | 1.00 | -0.02em | Heading 600 | Comparison net difference and added isolates |
| display-xs | 38 | 1.00 | -0.02em | Heading 600 | Alert change in percentage points |
| h1 | 46 | 1.05 | -0.02em | Heading 600 | Page titles (margin 10px 0 10px) |
| h2 | 28 | 1.15 | -0.02em | Heading 600 | Section titles |
| h3-xl | 30 | 1.12 | -0.015em | Heading 600 | Alert row titles, "Alerts follow the latest monitoring date" |
| h3 | 26 | 1.12 | -0.015em | Heading 600 | Period card titles, subsection titles |
| h4 | 20–24 | 1.12 | -0.015em | Heading 600 | Drawer subsections, culture dates, isolate names (organism names are italic) |
| drawer-title | 30 | 1.10 | -0.01em | Heading 600 | Drawer heading |
| brand | 27 | 0.90 | -0.02em | Heading 600 | `ward` + `evidence` (second half in accent `#5980a6`) |
| body | 15 | 1.55 | 0 | Body 400 | Default text |
| lede | 16 | 1.55 | 0 | Body 400 | Page subtitle, 72% text color |
| ui | 14 | 1.55 | 0 | Body 400 | Descriptions, table cells, drawer text, button labels (heading font) |
| label | 13 | 1.4 | 0 | Body 500 | Field labels, eyebrows, table headers, notes (labels use 70% text color) |
| caption | 12 | 1.4 | 0 | Body 400 | Footer, small notes |
| micro | 11 | 1.3 | 0 | Body 400 | Chart axis labels, tick labels, tag text |
| brand-sub | 10 | 1.0 | 0.14em | Body 400 | `TYKS × MYLAB` under the wordmark (uppercase, 65% text color) |

Buttons: Barlow Condensed 600, 14px default; 15–16px for page-level CTAs.

## 4. Colors

All colors come from one steel-blue accent plus cool neutrals. No other hues are used.

### Core

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#f2f2f3` | App background, drawer background, inputs |
| `--ev-card` | `#fbfbfc` | Card/panel surface (white at 72% over bg) |
| `--color-text` | `#1d1f20` | Primary text |
| text-muted | `rgb(29 31 32 / 72%)` | Secondary text, descriptions |
| text-label | `rgb(29 31 32 / 70%)` | Field labels, axis labels |
| `--color-divider` | `rgb(29 31 32 / 16%)` | All hairlines and card borders (1px) |
| row-divider | `rgb(29 31 32 / 10%)` | Table row separators |
| `--color-accent` | `#5980a6` | Primary button, active chart line, brand mark, big `%` suffix |
| `--color-accent-2` | `#728fab` | Reserved, not used on screens |
| overlay | `#2b2b2d` at 45% | Drawer backdrop |
| toast bg | `#1d2d3d` (accent-900) | Toast, solid tags, nav badge |

### Accent ramp
`100 #eef6ff` · `200 #d6ebff` · `300 #b5d9fd` · `400 #94bce3` · `500 #749dc4` · `600 #597ea3` · `700 #416180` · `800 #2c455d` · `900 #1d2d3d`

### Neutral ramp
`100 #f5f5f8` · `200 #e7e7ea` · `300 #d4d4d7` · `400 #b7b7ba` · `500 #98989b` · `600 #7a7a7d` · `700 #5d5d60` · `800 #424244` · `900 #2b2b2d`

### Where each shade is used
- Links, eyebrow text, icons: `accent-700` `#416180`. Hover link `accent-900`.
- Primary button: bg `#5980a6`, text `#f2f2f3`, border `#5980a6`; hover `#597ea3`; active `#416180`.
- Interval bar fill `accent-300` with 1px `accent-600` border; point marker `accent-900`.
- Comparison bar A `accent-700`; bar B `accent-300` with 1px right border `accent-700`.
- Age bars: baseline `accent-300` + 1px `accent-600` border; recent `accent-800`.
- Chart line `#5980a6`; chart points fill `#fff`, stroke `accent-700`; axis text `neutral-700`.
- Avatar circle `accent-200` with `accent-900` initials.
- Tag accent: bg `accent-100`, text `accent-800`. Tag neutral: bg `neutral-100`, text `neutral-800`, 1px divider border. Tag outline: 1px `#5980a6` border, `#5980a6` text. Tag solid: bg `accent-900`, text `#f2f2f3`.
- Hover on tabs/rows/ghost: `accent` at 8%. Active nav pill fill: `accent` at 16%. Secondary button hover: text at 7%; active 14%.

### Accessibility note
`#5980a6` on `#f2f2f3` is about 3.8:1. The prototype keeps it for the primary button and ghost buttons. If the repo's axe-core e2e flags `color-contrast`, darken `--button-bg` and ghost text to `#416180` (6:1). Link text and eyebrows already use `#416180`.

### Status mapping (replaces the repo's rose/amber/teal)

| Meaning | Prototype treatment |
| --- | --- |
| New, Ongoing, Insufficient evidence, Threshold met, Resistant (R) | Solid tag: bg `#1d2d3d`, text `#f2f2f3` |
| Cleared, Below threshold, neutral info | Neutral tag (`#f5f5f8`, `#424244`, 1px divider border) |
| Susceptible (S), "Primary", "Evidence unavailable", "N tested · minimum 30" | Outline tag (1px accent) |
| Frozen analysis, informative badges | Accent tag (`#eef6ff` / `#2c455d`) |

Map the repo's `Badge` tones to these: `neutral` → neutral, `violet` → accent, `success` → outline, `warning`/`danger` → solid.

## 5. Spacing, radii, elevation

- Spacing used: 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 56, 72. Common card paddings: `16px 22px` (field cells), `26px 30px` (card sections), `24px 28px` (alert page cards), `28px 30px 24px` (period cards).
- Page container: `max-width: 1320px`, side padding 32px. `main` padding `36px 32px 72px`. Gap between major sections 40px. Footer margin-top 72px.
- Radii: 16 cards/panels, 12 notice strips/toast/logo mark/bordered boxes, 10 buttons/inputs/selects/segmented control, 8 bar tracks, 6 interval bar ends and CI bars, 3 age bars, 999 tags and nav pills, 50% dots/avatar, drawer 20px on the left corners only.
- Shadows: card `0 1px 2px rgb(43 43 45 / 14%)`; md `0 3px 10px rgb(43 43 45 / 16%)`; drawer and toast `0 12px 32px rgb(43 43 45 / 22%)`.
- Borders: always 1px `--color-divider`. Cards are `border: 1px solid divider; overflow: hidden`.
- Multi-cell cards (filters, period cards, comparison controls) are CSS grids with 1px dividers between cells: `display:grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, Npx), 1fr))` where each cell has `box-shadow: inset -1px -1px 0 var(--color-divider)` and the grid has `margin: 0 -1px -1px 0; clip-path: inset(0 1px 1px 0)`. Column minimums: filters 230, period cards 420, investigate 380, comparison controls 260, comparison result 420 / 190, alert measures 260.

Full token files: `tokens.css` (drop-in for `src/styles/tokens.css`), `design-tokens.json`, `components.reference.css`.

## 6. App shell (all pages)

**Header** (sticky, top 0, z-index 30, bg `#f2f2f3`, bottom border divider). Inner container max 1320, padding 0 32.
- At ≥1180px, one row, 36px column gap: brand · nav pills · right cluster (right cluster pushed with `margin-left:auto`). Min height 68px.
- Below 1180px, the nav wraps to a second row (full width, min-height 46px, top border divider, horizontal scroll if needed).
- Brand button: 38×38 mark, radius 12, bg `#5980a6`, white-ish "w" glyph 22px; to its right the wordmark (27px, `ward` in text color, `evidence` in accent) over `TYKS × MYLAB` (10px, tracking 0.14em).
- Nav pills: height 38, radius 999, padding 0 16, 15px, gap 8. Items: Ward overview · Investigate susceptibility · Resistance alerts (with count badge: solid tag, padding 0 8) · Patient history (with users icon 17px, accent-700). Active pill: 16% accent fill. Hover: 8% accent fill.
- Right cluster (gap 12): outline tag with 7px dot (`Synthetic data`, or `External feed` in feed mode); 36px ghost icon button (help, 19px icon) opens the "Reading the evidence" drawer; 36px circular avatar "WE".

**Notice strip** under header (container, margin-top 14): bordered 12px-radius card (`#fbfbfc`), padding `8px 16px`, 13px. Flask icon 15px, bold "Fixture preview", `/`, text, ghost "Details →".
- External feed line (feed mode): 7px dot + "External feed · Live updates connected · UTC reporting date · Receiving results", bottom border.
- Stale banner (`dataState=stale`): card, margin-top 18, padding `14px 18px`, alert icon 20px, bold "Could not refresh the workspace", 13px muted line "Showing the last successful snapshot. Results may be out of date. Network request failed.", secondary button "Retry refresh".

**Page header** (every page): eyebrow row (13px/500, muted: `Antibiotic susceptibility ── Tyks × Mylab`, with a 36px hairline between) → h1 (46px) → lede (16px, muted). Actions sit right, bottom-aligned (flex, wrap, gap 24 between title block and actions, 10 between buttons). Back links on sub-pages: ghost button with left arrow, margin-bottom 18.

**Footer**: margin-top 72, top border, padding-top 18, flex space-between wrap, 12px muted: dot + "Imported dataset: 2 Oct 2023 – 27 Sep 2026", `surveillance-v1 · Snapshot 8 · fixture-run-001`, `TYKS × mylab · JunctionX Turku · Prototype`.

**Toast** (after any export click): fixed, bottom 28, horizontally centered, bg `#1d2d3d`, text `#f2f2f3`, padding `12px 20px`, radius 12, 14px, download icon 16px, shadow-lg, auto-dismiss after 2.6s.

## 7. Screens

Screenshot file names refer to `screenshots/`.

### 7.1 Ward overview (`01`, `02`–`15`)
Repo: `App.tsx`, `CohortControls.tsx`, `EvidenceCards.tsx`, `AntibioticComparison.tsx`, `SusceptibilityTrend.tsx`, `IntervalPlot.tsx`.

1. Page header. Actions: primary "Investigate cohort" (search-check icon, `12px 20px`, 16px) and secondary "Export snapshot" (download icon; disabled while loading or error).
2. **Cohort form card** (margin-top 36). Row 1: "Report end date" date input (min-width 200) + either a ghost-secondary "Use latest date" button (when a past date is pinned) or a dot + "Latest published samples"; help text 13px muted beside it. Row 2: four select cells (Ward, Specimen, Organism, Primary antibiotic). Optional "Population filters" row (First isolate selection, Sex, Minimum age, Maximum age, plus inline error). Footer row (padding `12px 22px`, top border): ghost "Population filters" (sliders icon, solid count badge when active), filter summary text, ghost "Reset filters" (reset icon), primary "Apply cohort →" pushed right (`10px 22px`, 15px).
3. Cohort line (margin-top 14): 8px accent dot + cohort text (14px); right: ghost "Patient history →".
4. **Evidence section** (margin-top 40): eyebrow (13px/500, accent-700) "Evidence · two overlapping periods"; h2 "Susceptibility at a glance"; drug line; right note with left divider border. Then one card with two panels:
   - Title row: icon 19px (layers for 12 months, clock for 28 days) + h3 26px + help icon button at right.
   - Date range 13px muted.
   - Available state: hero number 84px + `%`; line "susceptible · **N** tested isolates"; `details` "Counts & uncertainty" (chevron) containing counts, interval plot, "95% interval a–b", eligible / not tested counts. The 12-month panel has a 3px accent bar across its top when available.
   - Unavailable states (see section 8): outline tag, h3 28px title, 14px text, optional ghost "View 12-month evidence →" on the 28-day panel.
   - "Partial imported-dataset coverage" 12px line when the period starts before 2 Oct 2023.
5. **Antibiotic comparison card** (margin-top 40): header (eyebrow "A shared isolate set", h2 40→28px "Antibiotic comparison", compare icon 26px right); control grid (Antibiotic A + "Primary" tag; "Compare with B" select; "Comparison period" segmented control); result area; footer with `details` "Paired counts & missing tests" and caption. Result: left bar chart (rows `64px 1fr 76px`: code in heading font 24px, 30px-tall track radius 8, value 26px), right two stat cells (net difference, additional isolates susceptible to B) with 44px figures. Below: caption "Historical laboratory susceptibility. This comparison does not establish clinical suitability or treatment success."
6. **Trend card** (margin-top 40): header with "Refresh now" secondary button (refresh icon); controls row (Chart year select + help text); status line (12px, "Chart snapshot: latest cutoff … · revision 8."); SVG chart (`viewBox 0 0 780 290`, min-width 600, scrolls horizontally on small screens): gridlines at 0/25/50/75/100% in divider color, y labels 11px `neutral-700`, x month labels, line 2px `#5980a6` with round caps/joins, points r=5 fill `#fff` stroke 2px `#416180`, gaps shown as dashed vertical line with `<30 tests` label; caption; `details` "Monthly values, counts & exports" with a 5-column grid table (28-day period ending, Susceptible, Tested, 95% interval, Snapshot → ghost "Inspect").

### 7.2 Investigate susceptibility (`16`–`18`)
Repo: `CohortInvestigation.tsx`.
Back link, page header (export button right), cohort bar card (padding `16px 22px`, bold cohort text 16px, 13px note, ghost "Change cohort →"), card "Evidence behind the estimate" with two cells (64px figure, susceptible/tested line, date range, interval plot), `details` "Full count table" (Period, Eligible, Tested, Susceptible, Resistant, Not tested), ghost "Calculation & provenance →". Then the antibiotic comparison card (same as 7.1) and a 13px footnote linking to Resistance alerts.

### 7.3 Resistance alerts (`19`, `20`)
Repo: `ResistanceAlerts.tsx`, `api/alerts.ts`.
Page header with a 52px bordered bell tile at right. Summary strip: two cells (Monitoring date `27 Sep 2026`; Configuration "N monitored groups · proposed 10 pp threshold") in 28px heading font. Card "Alerts to investigate": each row `padding 24px 30px`, status tag, h3 30px title, group line, change in bold + "First detected …", optional low-evidence line, primary "Investigate alert →" on the right. Card "Monitored groups": 6-column table (Patient group + antibiotic, Recent resistance, Baseline resistance, Change, Evaluation tag + reason, Snapshot CSV/JSON buttons), min-width 860 with horizontal scroll; figures in heading font 22px. Closing `details` "How resistance alerts differ from the overview". When the report date is a past date, show the empty card "Alerts follow the latest monitoring date" with primary "View latest monitoring".

### 7.4 Alert investigation (`21`–`26`)
Repo: `InvestigationPage.tsx`, `ReviewFlags.tsx`.
Back link, page header, snapshot row (segmented control Current evaluation / Original detection + "Showing … · Current alert state: tag"). Two-column layout: main column `flex: 3 1 600px`, aside `flex: 1 1 300px`, gaps 36 / 32, wraps below about 960px.
- Main: monitor card (microscope icon, bold group, drug and monitoring date, evaluation tag); tab bar (`role=tablist`; 15px; padding `12px 20px`; active tab has a 3px accent underline; hover 8% accent): Evidence overview, Population context, Timeline and history.
  - Evidence: card "Resistance in separate periods" with two figure cells (60px) and interval plots; change row (38px figure + explanation); card "The counts behind the change" (table).
  - Population: card "Age composition" with legend and paired bars (10px high, baseline vs recent), info note; one card per breakdown (Age groups, Sex, Collection setting, Organism mix).
  - Timeline: vertical timeline (11px square-outline markers joined by a 1px line) and "Alert history" list with tags and revision numbers.
  - Always last: card "Export this analysis" (primary CSV, secondary JSON) and `details` "Snapshot & method".
- Aside: card "Review context" (definition list rows with divider lines), card "Read this as a starting point." with info icon.

### 7.5 Drawers (`27`–`34`)
Repo: `ui.tsx` `Drawer`, `PatientHistoryDrawer.tsx`, `ProvenanceDrawer.tsx`, `App.tsx` (guide).
Shell: right-anchored, width `min(580px, 100vw)`, full height, bg `#f2f2f3`, left border divider, radius `20px 0 0 20px`, shadow-lg, overflow hidden; backdrop `#2b2b2d` at 45%. Header: padding `24px 28px 18px`, bottom border; eyebrow "Ward Evidence" (13px/500 accent-700), title 30px, description 14px muted, close = secondary 36px icon button. Body: padding `24px 28px 40px`, scrolls. Esc and backdrop click close it (keep Radix Dialog behaviour, focus return and `data-drawer-return`).
- **Patient microbiology history**: patient ID search input (padding-left 38, search icon 18px) → empty card "Find a patient" / "No matching patients" / result rows (38px bordered tile with user icon, ID in heading font 22px, caption). Patient view: back ghost, 46px tile, ID 32px + "Synthetic patient" tag, lookback/cutoff row, "N prior cultures" with "Expand all results" ghost toggle, timeline of cultures (28px flask marker, date 26px, specimen tag, ward · ID, isolate card with italic organism name, phenotype solid tags, antibiotic table with S/R tags), footnote, "Export this page · CSV / JSON".
- **Behind the evidence**: "Frozen analysis" accent tag, title, "Samples through …"; sections Applied population, Reporting periods (bordered boxes with code range in `<code>` 12px and coverage tags), Feed provenance (feed mode only), How counts are formed (numbered list), metadata list, export card (primary "Download CSV", secondary "Download JSON").
- **Reading the evidence**: intro card with activity icon and 34px line, then three text sections, "Explore support states" shortcut buttons (Urology, Intensive care, Geriatrics, Health centre North, Mecillinam comparison).

## 8. States (every one has a screenshot)

| State | Screenshot | Behavior and look |
| --- | --- | --- |
| Ready | `01`, `16`, `19`, `21` | Default |
| Loading | `02`, `17` | "Loading evidence…" bar with 20px spinner (use the repo's `LoaderCircle` + `.spin`), two skeleton panels 300px tall filled with diagonal hairlines (`repeating-linear-gradient(135deg, divider 0 1px, transparent 1px 9px)`); Export disabled; trend shows "Loading N monthly cutoffs…". `aria-busy="true"`, `role="status"` |
| Error | `03`, `18` | Card with alert icon 22px, bold "Could not load evidence", message, secondary "Retry →". `role="alert"` |
| Stale refresh | `04` | Banner under the notice strip (section 6) with "Retry refresh"; content stays visible |
| Filter panel open | `05` | Adds the population row; count badge on the toggle |
| Filter validation error | `06` | Inline `role="alert"` text, 13px, `accent-800`, alert icon 16px |
| Sparse recent cohort (ICU) | `07` | 12-month available; 28-day shows outline tag "29 tested · minimum 30", "Insufficient data", link to 12-month evidence |
| No tests (Geriatrics) | `08` | Both panels "No susceptibility tests recorded" |
| Empty cohort | `09` | Both panels "No eligible isolates in this period" |
| Not applicable | `10` | Both panels "This comparison is not applicable" with reason |
| Past report date | `11` | "Use latest date" button replaces the "Latest published samples" dot |
| Comparison below 30 pairs | `12` | Bordered note box with help icon, "Only N paired tests" |
| Comparison not chosen | `13` | Centered card "Choose two antibiotics" |
| External feed | `14` | Extra feed line under the notice strip; extra tags in provenance |
| Export toast | `15` | See section 6 |
| Alerts, past date | `20` | Empty card with primary "View latest monitoring" |
| Original detection | `22` | Same layout, original snapshot values |
| Population tab | `23` | See 7.4 |
| Timeline tab | `24` | See 7.4 |
| Insufficient-evidence alert | `25` | Change shows "Not reported"; withheld text under the figure |
| Cleared alert | `26` | Neutral "Cleared" tag |
| Drawers | `27`–`34` | See 7.5 |

Screenshot rendering note: the screenshot tool does not draw a few SVG icons (layers, clock, refresh) and shows the chart-year select at its first option. Both render correctly in the live prototype.

## 9. Interactions and motion

- Focus: `:focus-visible { outline: 2px solid #5980a6; outline-offset: 2px }`. Inputs: border becomes accent on focus; hover border `rgb(29 31 32 / 45%)`.
- Buttons: primary hover `#597ea3`, active `#416180`; secondary hover 7% fill, active 14%; ghost hover accent 10%, active 18%; disabled opacity 0.45, `not-allowed`.
- Tabs, nav pills, patient result rows: hover fill accent 8%.
- Motion is not part of the prototype. Suggested: 160ms (`--duration-fast`) for color and background; drawer slide from right 240ms ease-out with backdrop fade 160ms; respect `prefers-reduced-motion`.
- Navigation or back actions scroll to top. "View 12-month evidence" switches the comparison window and scrolls to the comparison card.
- Form: ages must be 0–120 and min ≤ max, otherwise show the inline error and keep the filter panel open. Apply cohort commits the draft; Reset restores defaults and applies them.

## 10. Implementation plan for the repo

1. Replace values in `src/styles/tokens.css` with `tokens.css` from this bundle (keeps every existing variable name, adds the new ones).
2. Add the fonts (section 3) and set `body { font-family: var(--font-body); font-size: 15px; line-height: 1.55 }` and `h1–h4 { font-family: var(--font-heading); font-weight: 600 }`.
3. Restyle the shared classes used by `src/components/ui.tsx` (`button`, `badge`, `panel`, `section-heading`, `eyebrow`, `field`, `empty-state`, `loading-state`, `error-panel`, `refresh-notice`, `drawer-*`, `table-scroll`, `icon-button`) using `components.reference.css`.
4. Rebuild the shell in `App.tsx` (top bar, notice strip, banners, footer) and remove the left navigation.
5. Go screen by screen in the order of section 7. Keep component props and data flow intact; change markup only where the layout requires it (for example the tab bar, the cell grids, the page header row).
6. Update chart components (`IntervalPlot.tsx`, `SusceptibilityTrend.tsx`) to the shapes and colors in sections 4 and 7.
7. Run `npm run lint`, `npm test`, `npm run build`, then `npm run test:e2e`. Compare each state with its screenshot at a 1185px wide viewport, then check 390px and 768px.

## 11. Assets

- Icons: Lucide (the repo already uses `lucide-react`). Stroke 1.5px (prototype) at 13–26px; use `strokeWidth={1.5}`. Used: ArrowRight, ArrowLeft, Download, Search, SearchCheck, X, Info, CircleHelp, CircleAlert, Bell, Users, User, FlaskConical, SlidersHorizontal, RotateCcw, Clock, Layers, RefreshCw, ChevronDown, FileText, ShieldCheck, GitCompare, Activity, Microscope, Calendar.
- Logo mark: a "w" drawn as a stroked path (3.3 stroke, round caps) inside a 38px rounded square (`#5980a6`). SVG path in the HTML source (`viewBox 0 0 40 40`, `M9 11v13a6 6 0 0 0 11 3 6 6 0 0 0 11-3V11M20 14v13`).
- No photos or raster imagery.

## 12. Files in this bundle

- `PROMPT.md`: prompt to paste into Claude Code.
- `tokens.css`: drop-in token file for `src/styles/tokens.css`.
- `components.reference.css`: CSS recipes for the repo's shared classes and new patterns.
- `design-tokens.json`: the same tokens as JSON.
- `screenshots/`: 34 full-page state screenshots at 1185px wide (`00-contact-sheet.png` is the overview).
- `reference/Ward Evidence.dc.html`: the prototype (open in a browser). `reference/support.js` and `reference/_ds/` are its runtime and base stylesheet.
