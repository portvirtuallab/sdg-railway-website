# Accessibility

Target: **WCAG 2.2 AA** on every page, on desktop and mobile.

## Built in

- Skip link to `#main-content`; landmarks `header`, `nav[aria-label=Main]`, `main`, `footer`.
- One `h1` per page and headings in order; breadcrumbs as `nav[aria-label=Breadcrumb]`.
- Disclosure submenus (`button[aria-expanded]` + `aria-controls`) that close with Escape or an
  outside click. Parent pages are also real links.
- Touch targets of at least 44 × 44 px (`min-h-11`, `min-w-11`).
- Visible focus outline (3 px) on every interactive element.
- `prefers-reduced-motion` disables animations and transitions.
- External links that open a new tab announce it to screen readers.
- The educational simulation notice is a `role="note"` on every page.

## Colour

Text colour pairs are tested in `tests/unit/tokens.test.ts` (≥ 4.5:1). The source green `#37a053`
reaches only 3.3:1 on white, so it is reserved for large text, borders and graphics. Text and
buttons use `railway-green-700` (`#2a7d40`).

## Checked automatically

`tests/e2e/pages.spec.ts` runs axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on every page at desktop
and mobile sizes, and fails on serious or critical issues. It also tests the skip link and the
keyboard behaviour of the submenus.

## Checked manually before each release

- Keyboard-only walk through each core journey (find a terminal, view equipment, open the
  glossary, request a quotation).
- Screen reader spot check (NVDA + Firefox, VoiceOver + Safari).
- 200% and 400% zoom, 320 px width without horizontal scrolling.
- Alt text for every migrated image. The source site had none (V-15).
- Map information is always available as a list or table as well.
