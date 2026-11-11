# SDG Railway – Source site audit (Phase 1)

- **Source:** https://sites.google.com/escolaeuropea.eu/sdgrailway
- **Review date:** 2026-11-11
- **Status:** first pass complete; the open items need owner input.

This audit records what exists on the current Google Sites website before any new site is built. It is evidence, not a redesign. The live site was only read. Nothing was edited, submitted or unpublished.

## Contents

| File / folder | What it is |
|---|---|
| `page-migration.md` | Page inventory and migration map for all 13 pages, including 2 hidden ones |
| `embedded-tools.md` | Every embedded tool and workflow, with integration options for the **quotation simulator** |
| `verification-log.md` | 21 findings to resolve (data conflicts, claims, accessibility, rights) |
| `asset-register.csv` | 182 image placements with source page, URL, host, alt text and migration status |
| `source-html/` | Raw HTML of each page as served on the review date |
| `extracted/` | Structured JSON per page (sections, text, images, links, embeds) and `embeds/` with every custom HTML/JS embed verbatim |
| `source-data/` | Network map export from Google My Maps (`network-map.kml`) and parsed `network-map.json` |
| `source-apps-script/` | Client-side HTML of the Railway Quotation Simulator (Apps Script web app) |
| `../../scripts/audit/` | Scripts that regenerate `extracted/`, the map JSON and the simulator HTML (Node.js + `cheerio`) |

## Key numbers

| Item | Count |
|---|---|
| Pages | 13: 11 in navigation, 2 hidden (`our-locomotive-models`, `railway-dashboard`) |
| Image placements | 182 (162 on Google Sites, 20 on postimg.cc); **0 with alt text** |
| Custom embeds with content | 12 + a shared footer embed on every page |
| Apps Script deployments | 3: PIN check, contact form, quotation simulator |
| Terminals in the Services directory | 31 in 6 countries (FR 6, ES 7, IT 5, PT 7, JO 3, EG 3) |
| Map | 10 corridor layers, 27 unique terminal locations, 14 route lines (ES, FR, IT, PT) |
| Locomotive models | 12 named units (E-PRS numbering) plus EURODUAL and T3000e technical pages |
| Glossary terms | 24 |
| Sales conditions | 23 sections (2026/2027) + Drive PDF |

## Provisional brand tokens

These come from colours used in the site's own embed code. They were **not** extracted from approved brand files, so they are provisional until the owner supplies the logo source.

| Token | Value | Evidence |
|---|---|---|
| `railway-blue-900` | `#062659` | Most-used colour in the embeds (27×): headings, panels, form labels |
| `railway-green-600` | `#37a053` | Section subheadings and the contact form button (10×) |

The network cards use a separate accent palette (`#ef9f27`, `#378add`, `#1d9e75`, `#639922`), apparently one colour per country. This palette is not treated as brand identity.

## What blocks a complete migration

1. **Quotation simulator back end.** Apps Script source and Google Sheets for pricing, schedules, terminals and the PIN list (V-20, V-12).
2. **Image originals and rights** for all 182 placements, especially the 20 on postimg.cc (V-16).
3. **Terminal and route data conflicts** between the directory, the map and the Departures Board (V-03 to V-08, V-11).
4. **Owner decisions** on contact details, licence wording and the PIN gate (V-09, V-12, V-14).

Everything else can proceed: the repository setup, design system and page rebuilds (Phases 1 to 3).
