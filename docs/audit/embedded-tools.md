# Embedded tools and workflows

Every custom embed was recovered from the page source (`data-code` attributes) and saved verbatim in `extracted/embeds/`. Tools that run on Google Apps Script were inspected only on the client side. **Their server code (`Code.gs`) and any linked Google Sheets are not publicly visible and must be supplied by the owner.**

No form was submitted and no PIN was tried during the audit.

## 1. Quotation workflow (priority integration)

Current learner journey:

```
/request-a-quotation
  ├─ PVL PIN gate (embed 01) ── GET  Apps Script A ?code=NNNN → {valid:true|false}
  │      └─ on success shows "Continue to Dashboard" link
  └─ Departures Board (embed 02) – client-side only
/request-a-quotation/railway-dashboard  (hidden page)
  └─ "Ready to quote? CLICK HERE" → Apps Script C: Railway Quotation Simulator (5-step wizard)
```

| Component | Where | Runs | Data source | Status |
|---|---|---|---|---|
| PVL PIN gate | `request-a-quotation--embed-01.html` | Browser + Apps Script A (`AKfycbxGDEMJ…/exec`) | Server-side list of valid 4-digit codes (not visible) | Working; **access control is cosmetic** – the dashboard URL is public (V-12) |
| Departures Board | `request-a-quotation--embed-02.html` | Browser only | Hard-coded: 3 services (STD-RAIL 80 km/h DG allowed Mon–Fri 08:00; EXP-RAIL 100 km/h Mon/Wed/Fri/Sat 14:00; GRN-RAIL 70 km/h Mon/Wed 10:00), 10 route legs with km, service-specific and global blocked dates for 2026 | Working; labelled "Live schedule" although it is generated (V-11) |
| Railway Quotation Simulator | Apps Script C (`AKfycbwSdyo…/exec`), client HTML recovered in `../source-apps-script/quotation-simulator.user.html` | Browser + server functions `apiGetBootstrapData`, `apiGetScheduleData`, `apiGenerateQuote` | Server-side (terminals, UTI types, ADR classes, services, schedules, **pricing**) – not visible | Working (page loads); pricing logic unknown |

### Simulator steps (from client source)

1. **Route** – origin country → terminal, destination country → terminal, routing metric `DISTANCE` | `TIME`.
2. **Cargo** – UTI type, units, total weight (kg), cargo description, dangerous goods toggle → ADR class.
3. **Service & departure** – service cards (train names: *Iberian Freight Express* = STD-RAIL, *Eurostar Cargo Rapid* = EXP-RAIL, *EcoRail Green Line* = GRN-RAIL; levels standard/express/green/premium) and an availability calendar built from the schedule data.
4. **Contact** – company, contact name, email; optional insurance with declared goods value.
5. **Review & generate** – calls `apiGenerateQuote(payload)` and gets back a route (with `transitMin`), pricing (`pricing.total` + currency) and a generated booking reference. "New quote" resets the wizard.

### Integration options for the new site (decision for owner)

| Option | What it means | Pros | Cons |
|---|---|---|---|
| **A. Keep Apps Script as backend** (recommended baseline) | New static front end (Next.js) reproduces the wizard and calls the same Apps Script endpoints via `fetch` (doPost/doGet JSON) | Pricing and data stay where trainers already maintain them; no new service; preserves compatibility | Needs owner access to the script to add a JSON API (`google.script.run` works only inside Apps Script HTML); CORS must be handled |
| B. Link out | New page explains the exercise and links to the existing simulator | Zero risk, immediate | Two visual identities; no improvement |
| C. Port fully client-side | Move tariffs/schedules into versioned JSON in the repo | Works offline, testable, version-controlled | Requires the tariff dataset and pricing rules; trainer edits go through GitHub |

The PIN gate should be kept only if it really controls access. That would mean the simulator checks the PIN server-side. Otherwise it should be presented as a classroom step, not as security.

**Needed from owner:** Apps Script projects A, B and C (source or editor access), the backing Google Sheets (tariffs, terminals, schedules, PIN list), and confirmation of what the simulator does with submitted contact data (stored? emailed?).

## 2. Contact form

`contact--embed-01.html`. Fields: Full Name\*, Company / Organization, Email\*, Type of Inquiry\*, Message\*. It POSTs JSON to Apps Script B (`AKfycbxMwJa6…/exec`). This sends real personal data from learners to a Google script. The new site must not send personal data to an unapproved destination, so the same endpoint can be reused only once the owner confirms it is approved, with a privacy notice added.

## 3. Network map

`network-routes--embed-01/02`. A Google My Maps embed (`mid=12qF7fhR-AwS88h5Y0DNExOJO8TWq3uI`) and the "FAST Rail Services" cards: 13 cards with country filter (FR, ES, IT, PT, JO, EG).
The KML export was downloaded to `../source-data/network-map.kml` and parsed to `network-map.json`. It contains 10 corridor layers, 39 terminal points (27 unique locations; shared terminals repeat across corridors), 14 route lines and 7 Portugal entries with no geometry, across Spain, France, Italy and Portugal. Jordan and Egypt appear in the directory and in the cards but **not on the map**.

## 4. Load Planner – Visual Simulation

`services_container-and-trailer-packing--embed-01.html`. Client-only. The learner adds ITUs (20', 40', 45', trailer) to wagons and checks the load balance. Assumed weights are 22/30/32/34 t, with wagon thresholds of OK ≤ 28 t and warning ≤ 32 t. These values are scenario assumptions and must be labelled as such.

## 5. Glossary and conditions

- `resources--embed-01.html`: SDG Railway Glossary, 24 terms in an accordion. Will become structured data.
- `about-us_railway-general-sales-conditions--embed-01.html`: General Conditions of Sale 2026/2027, 23 accordion sections. There is also a separate Drive PDF.

## External dependencies found

| Dependency | Used by | Risk |
|---|---|---|
| `script.google.com` (3 deployments) | PIN gate, contact form, quotation simulator | Owner-controlled; redeployment changes URLs |
| `www.google.com/maps/d` | Network map | Embed only; replace with Leaflet + OSM (licence/attribution) |
| `i.postimg.cc` (20 images) | Home, Fleet, Dangerous Goods embeds | Third-party free host; can disappear – originals needed |
| `drive.google.com` | Sales conditions PDF | Sharing permissions |
| `cdn.jsdelivr.net/@tabler/icons-webfont@latest` | Network cards | Unpinned `@latest` |
| Google Fonts (Montserrat, DM Sans/Mono) | Several embeds | Self-host in the new site |
