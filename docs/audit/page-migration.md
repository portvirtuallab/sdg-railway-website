# Page inventory and migration map

Source site: `https://sites.google.com/escolaeuropea.eu/sdgrailway` · Reviewed: 2026-11-11 · Method: HTTP download of every page (`source-html/`), structured extraction (`extracted/`), browser check of navigation and rendered embeds.

13 pages found: 11 in the main navigation, plus **2 hidden pages** that are reachable only through links inside the content.

Default preservation action for every page: **Keep and modernise**. "Embeds" counts only custom HTML/JS embeds with real content. The shared footer licence embed, which appears on every page, is not counted.

| # | Source path | Title | Parent | In nav | Sections | Images | Embeds (substantive) | Proposed target | Action | Verification needs |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/home` | Home | — | Yes | 14 | 22 | 1 (service cards with 4 postimg images) | `/` | Keep and modernise; move hero text into HTML | Testimonials ("What our clients say") must be labelled as simulation or removed |
| 2 | `/about-us` | About Us | — | Yes | 14 | 15 | 2 (team panel, glossary link) | `/about-us` | Keep and modernise | "Compliance & Commitment" claims ("highest European standards") need reframing as scenario content |
| 3 | `/about-us/railway-general-sales-conditions` | Railway General Sales Conditions | About Us | Yes | 9 | 7 | 1 (23-item accordion of conditions, 2026/2027) | same | Keep; disclaimer stays visible | Drive PDF `1D-3Punx4oH0hc-iJx83pYqZQfbl_ovcC` must be copied locally with owner approval |
| 4 | `/services` | Services | — | Yes | 33 | 46 | 0 | same | Keep; terminal directory becomes structured data + filter | 31 terminals in 6 countries; naming conflicts (see verification log V-03…V-08) |
| 5 | `/services/container-and-trailer-packing` | Container and Trailer Packing | Services | Yes | 17 | 17 | 1 (**Load Planner** visual simulation) | same | Keep; rebuild planner as component | Regulatory references (UIC, EN 12195, RID, SOLAS VGM) need expert review |
| 6 | `/services/railway-equipment-fleet` | Railway Equipment Fleet | Services | Yes | 13 | 20 | 1 (ITU gallery, 9 postimg images) | same | Keep | EURODUAL spec table misaligned (V-01) |
| 7 | `/services/railway-equipment-fleet/our-locomotive-models` | Our Locomotive Models | Railway Equipment Fleet | **No (hidden)** | 17 | 8 | 0 | same | Keep; add to nav under Fleet | 12 named locomotives; "Greek earring" mistranslation (V-02) |
| 8 | `/services/dangerous-goods` | Dangerous Goods | Services | Yes | 5 | 10 | 1 (3 postimg images) | same | Keep; mark approval steps as simulated | Mentions "DG Teams / coordinators" as real (V-10); OTIF link |
| 9 | `/network-routes` | Network & Routes | — | Yes | 5 | 7 | 2 (**Google My Maps** embed + "FAST Rail Services" cards) | same | Keep; rebuild map with Leaflet from recovered KML + accessible table | Map data recovered (`source-data/network-map.kml`); coordinate error (V-04) |
| 10 | `/request-a-quotation` | Request a quotation | — | Yes | 5 | 8 | 2 (**PVL PIN gate**, **Departures Board**) | same | Keep workflow; see `embedded-tools.md` | Depends on 2 Apps Script deployments (server code not visible) |
| 11 | `/request-a-quotation/railway-dashboard` | Railway Dashboard | Request a quotation | **No (hidden)** | 4 | 8 | 0 (button → Apps Script **Quotation Simulator**) | same | Keep; integrate simulator | Page is publicly reachable without the PIN (V-12) |
| 12 | `/contact` | Contact | — | Yes | 6 | 7 | 1 (**contact form** → Apps Script POST) | same | Keep; contact details labelled as scenario | `contact@sdgrailway.com`, `+34 93 000 000`, `www.sdgrailway.com` are placeholders (V-09) |
| 13 | `/resources` | Resources | — | Yes | 4 | 7 | 1 (**SDG Railway Glossary**, 24 terms, accordion) | same | Keep; glossary becomes structured data + search | — |

Image counts are placements. They include the logo and banner, which repeat on every page. See `asset-register.csv` (182 placements).

## URL continuity

Google Sites does not allow redirects controlled by the new application. The original site stays live and untouched until the owner approves the transition. Trainers' existing links will keep working during preview, and the redirect plan will be prepared in Phase 8.

## Shared elements (every page)

- Header: SDG Railway logo + 7 top-level entries with 2 submenus; "Más" overflow menu (Spanish UI label from Google Sites).
- Banner background image per page (`placement = header-background` in the register).
- Footer: copyright notice from Escola Europea Short Sea Shipping. It lists the ® marks Port Virtual Lab, SDG Lines, SDG Airlines, MEDtrade and Playforwarding. **SDG Railway is not listed with ®.** It also includes a CC BY-NC-ND 4.0 licence badge and links to pvl.one, escolaeuropea.eu, LinkedIn, Instagram and Facebook.
- Licence conflict to resolve with the owner: the footer says "All rights reserved", while the embed says "CC BY-NC-ND 4.0" (V-14).
