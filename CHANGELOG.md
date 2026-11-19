# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Access codes: the ACCESS_CODES tab of the Sheet holds the PVL code list. Valid codes issue,
  accept and list quotes; any other code only gets an example quote (not recorded, no PDF, cannot
  be accepted). Replaces the TEAMS tab and the 4-digit PIN.
- More visible Port Virtual Lab branding: “PVL powered by Escola Europea” in the top bar of every
  page, the home hero and the footer.

### Changed

- Railway Equipment Fleet: the “Technical data under review” notice is removed (the data stays).

### Added (Sheet back end)

- Google Sheet back end (v8): one quotation engine (`src/engine`) shared by the website and the
  Apps Script service (`apps-script/`). Prices replay the v7 Apps Script exactly (100 logged
  quotes since 13 May 2026 match to the cent). The service records quotes, versions, bookings and
  history in the Sheet, numbers them under a lock (no duplicates) and saves a PDF per quote.
- Non-destructive Sheet set-up (Railway Quoter → Set up v8): ROAD_LEGS, TEAMS, BOOKINGS, HISTORY,
  capacity and unit-limit columns, and the missing `SurchargeCode` header.
- Live Sheet data on the website: network statistics, services and timetable, departures,
  corridors (from LINKS), terminal directory (77 terminals, photos kept by city), unit cards and
  rail tariff table; build-time snapshot as fallback (`npm run sheet:snapshot`).
- Quote form: terminals grouped by country, rail route preview, routing by distance or time,
  comparison of the services with price and first train, PDF link in Drive.

### Removed

- DEMO-2026.1 test catalogue, its generator and the browser-only quote engine and store; the
  separate terminal and corridor lists copied from the old site (the Sheet is the only source).

### Added (earlier in this release)

- Intermodal quotation prototype (brief of 19 November 2026): Get a quote form with RWQ quotes,
  prices by leg, scope, validity and train; acceptance into RWB bookings with assigned or pending
  train; My quotes and bookings with terminal orders, print/PDF and Click & Cargo handoff (JSON).
- Versioned DEMO test catalogue (lanes, trains, rates, road legs, ITUs, teams) and its generator.
- New pages: How it works, My quotes and bookings, Teaching help (worked example, common errors,
  trainer notes).
- Network and trains: train table and departures from the catalogue; terminal directory moved here.
- Equipment and cargo hub with ITU compatibility by train.
- Product documentation: page and component map, data model and ERP mapping, acceptance
  criteria, outstanding business data, Port Railway migration plan.
- Source site audit: page inventory and migration map, embedded tools (including the Apps Script
  quotation simulator), verification log, image asset register, raw page sources and the network
  map export.
- Next.js static-export project with TypeScript, Tailwind CSS, ESLint, Prettier, Vitest and
  Playwright with axe-core.
- Site map preserving the 13 source pages, the navigation labels and order, and the `/home` path.
- Layout skeleton: skip link, accessible header with submenus, educational simulation notice,
  footer, breadcrumbs and 404 page.
- Provisional design tokens with contrast tests.
- CI (format, lint, types, unit, build, link check, end-to-end) and a manual GitHub Pages preview
  workflow.
- Issue and pull request templates, Dependabot configuration and project documentation.
