# Verification log

These are audit findings to resolve with the owner or a subject expert. They do not claim the site is defective. Source values stay in `extracted/` and `source-data/` unchanged. Nothing here has been corrected in the source.

Status key: **open** = needs owner/expert input · **decision** = owner choice needed · **fix-in-build** = can be corrected in the new site without changing meaning.

| ID | Page | Finding | Evidence | Proposed handling | Status |
|---|---|---|---|---|---|
| V-01 | Railway Equipment Fleet | The EURODUAL "Vehicle data" list is shifted by one row. Examples: "Starting tractive effort: Up to 2,800 kW", "Fuel tank: Up to 500 kN", "Transmission: Up to 4,000 l", "Maximum speed: AC/AC". The "Supply voltage" values are also split across two rows. | `extracted/services_railway-equipment-fleet.json` §7 | Keep the raw values; publish a structured table only after checking each label/value/unit against the manufacturer source | open |
| V-02 | Our Locomotive Models | "the Greek earring" appears twice. This looks like a mistranslation of *areté* (Spanish *arete* = earring). | §4, §5 | Correct to "areté" (meaning unchanged) | fix-in-build |
| V-03 | Services | The Barcelona terminal has different names: the directory says "Morrot Terminal", the map says "Can Tunis Freight Terminal", and the Departures Board code is `BCN-MORROT`. | services §15, KML | Owner to confirm the scenario terminal name; keep the source names as aliases | open |
| V-04 | Network map | The "Valenton Intermodal Terminal" point is at 48.8603, 2.3456, which is central Paris and not Valenton. | KML, France Mediterranean layer | Mark the coordinate as illustrative or correct it with owner approval | open |
| V-05 | Services | The Bilbao entry reads "Bilbao Mercancías (Terminal Intermodal de Bilbao – Jundiz / Arasur)". Jundiz and Arasur are in Álava, not Bilbao. The map says "Bilbao Port Rail Terminal (Olabeaga / ADIF)". | services §15, KML | Owner to confirm | open |
| V-06 | Services | Valladolid is named "Fuente de San Luis", which is the Valencia terminal name. The map says "Valladolid–Campo Grande". Valencia appears on the map but is missing from the directory. | services §16, KML | Owner to confirm | open |
| V-07 | Services | "TOLOUSE" is misspelt (should be Toulouse). | services §10 | Correct | fix-in-build |
| V-08 | Services | Under JORDAN, "Ramallah Intermodal Logistics Point (RILP)" is listed. Ramallah is not in Jordan. | services §23 | Owner to confirm the country grouping and whether the terminal exists | open |
| V-09 | Contact | Contact details look like placeholders: `contact@sdgrailway.com`, `+34 93 000 000`, `www.sdgrailway.com`, "Intermodal Hub – Barcelona". | contact §3 | Show as scenario details, with no live `mailto:`/`tel:` actions. Don't assume the domain is owned. | decision |
| V-10 | Dangerous Goods | The page presents "own reliable Dangerous Goods Teams" and "DG coordinators" as real. | DG §1 | Reframe as simulated approval steps | fix-in-build |
| V-11 | Request a quotation | The Departures Board says "Live schedule", but the data is hard-coded and generated in the browser. Its routes (Rotterdam, Antwerp, "Lisboa área") are not in the terminal directory or on the map. | embed 02 | Label as a scenario schedule. Owner to confirm the route list. | open |
| V-12 | Railway Dashboard | The PIN gate only reveals a link. The dashboard and simulator URLs are publicly reachable without a PIN. | Hidden page fetched directly (HTTP 200) | Decide whether the PIN is pedagogical or real access control | decision |
| V-13 | Home / About Us | There are claims of a "digital management platform", "highest European standards", compliance and optimised scheduling, plus client testimonials. | home §4, §11; about §9 | Frame as scenario/educational objectives; label testimonials or drop them | fix-in-build |
| V-14 | All pages (footer) | The footer says "All rights reserved", while the embed licence badge says CC BY-NC-ND 4.0. The ® list does not include SDG Railway. | footer | Owner to confirm the licence; no ® on SDG Railway | decision |
| V-15 | All pages | Zero of 182 image placements have alt text. | `asset-register.csv` | Write alt text during migration | fix-in-build |
| V-16 | Home, Fleet, DG | 20 images are hosted on `i.postimg.cc` (a free third-party host). | asset register | Request originals; store them in the repo | open |
| V-17 | Container and Trailer Packing | The page cites UIC 592, EN 12195-1, RID and SOLAS VGM as if they were operating instructions. SOLAS VGM is a maritime rule applied here to rail loading. | packing §1, §3 | Expert review; present as educational guidance with a source and date | open |
| V-18 | Load Planner | ITU weights (22/30/32/34 t) and wagon thresholds (28/32 t) are hard-coded assumptions. | packing embed | Label as scenario assumptions | fix-in-build |
| V-19 | Network cards | The "FAST Rail Services" cards load `@tabler/icons-webfont@latest` (unpinned). | network embed 01 | Self-host or pin the icons | fix-in-build |
| V-20 | Quotation Simulator | The server-side pricing, data and handling of submitted personal data (company, name, email) are unknown. | `source-apps-script/` | Owner to provide the Apps Script source and Sheets | open |
| V-21 | Our Locomotive Models | This page is hidden: it is not in the navigation and is reachable only from a text link on the Fleet page. The Railway Dashboard is also hidden. | nav extraction | Add the locomotive page to the Fleet submenu; keep the dashboard inside the quotation flow | decision |

## Access limitations during the audit

- Apps Script server code, the backing Sheets and the PIN list: not accessible.
- Image originals: only the resized copies served by Google Sites (`=w1280`/`=w16383`) and postimg are available. Rights status is unknown for all images.
- Drive PDF of the sales conditions: link recorded, not downloaded.
- Rendered dimensions were checked in the browser for the Home page only. The `dimensions` column in the register is pending.
