You are restyling the Ward Evidence frontend (this repo) to match a finished design prototype. Read these first, in order:

1. `design_handoff_ward_evidence/README.md` (spec: fonts, colors, spacing, every screen, every state, implementation plan)
2. `design_handoff_ward_evidence/screenshots/00-contact-sheet.png`, then the individual screenshots for the screen you are working on
3. `design_handoff_ward_evidence/tokens.css` and `components.reference.css`
4. `design_handoff_ward_evidence/reference/Ward Evidence.dc.html` for exact inline values when the README is ambiguous

Rules:
- The HTML in `reference/` is a design reference. Recreate it with the repo's React components, `src/styles/tokens.css`, `src/styles/global.css` and `src/components/ui.tsx`. Do not copy the HTML or its runtime into the app.
- Change the visual layer only. Do not touch API clients, query hooks, zod contracts, domain logic, routes, copy, accessible names or aria attributes. Existing tests must keep passing.
- Fidelity is high: match colors, font sizes, spacing, radii and states exactly.
- Fonts: Barlow Condensed 600 for headings, numbers and buttons; Barlow 400/500/700 for body. Install `@fontsource/barlow` and `@fontsource/barlow-condensed`.
- Replace the left navigation with the sticky top bar described in README section 6.
- Implement all states in README section 8 (loading, error, stale refresh, sparse, no tests, empty cohort, not applicable, validation error, comparison below 30, external feed, toast, drawers).

Work in this order and commit after each step: tokens and fonts → shared UI primitives → app shell → Ward overview → Investigate → Alerts → Alert investigation → drawers. After each step run `npm run lint && npm test && npm run build`. At the end run `npm run test:e2e` and compare each screen against its screenshot at 1185px, then check 768px and 390px. Report anything in the spec you could not match.
