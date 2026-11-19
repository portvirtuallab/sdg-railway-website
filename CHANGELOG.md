# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
