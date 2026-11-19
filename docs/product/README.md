# SDG Railway – intermodal quotation prototype

Implementation of the **SDG Railway website and training operation brief** (working document of
19 November 2026). The site becomes an intermodal rail quotation product for students acting as
freight forwarders in Click & Cargo, while keeping every page, URL and image of the original
website (`docs/audit/`).

| Deliverable (brief §7)                 | Where                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Page and component map                 | [page-and-component-map.md](page-and-component-map.md)                                                     |
| Functional prototype                   | Branch `feature/intermodal-quote` – pages Get a quote, My quotes and bookings, How it works, Teaching help |
| Data model and ERP mapping             | [data-model-and-erp-mapping.md](data-model-and-erp-mapping.md)                                             |
| End-to-end journey test                | `tests/e2e/quote-journey.spec.ts` (quote → accept → booking → handoff, plus error cases)                   |
| Verifiable acceptance criteria         | [acceptance-criteria.md](acceptance-criteria.md)                                                           |
| Outstanding business-data list         | [outstanding-business-data.md](outstanding-business-data.md)                                               |
| Port Railway migration / redirect plan | [port-railway-migration.md](port-railway-migration.md)                                                     |

## Operating model represented

```
Shipper / consignee → Freight forwarder (your team, Click & Cargo)
                    → SDG Railway, intermodal carrier (this website; also acts as MTO)
                    → MTO books train capacity → Railway undertaking
Supporting layers: Play Haulier road legs, terminals, infrastructure managers, rolling stock
```

The forwarder never contracts the railway undertaking directly. The website states which roles it
bundles (How it works).

## Data and back end

Everything comes from the **SDG Railway Google Sheet**: terminals, rail links, services,
timetables, tariffs, surcharges, Play Haulier road legs and teams. The website and the Apps Script
service share one engine (`src/engine`), and the service records every quote, booking and action
in the Sheet with a PDF in Drive. See [data-model-and-erp-mapping.md](data-model-and-erp-mapping.md),
[apps-script-review.md](apps-script-review.md) and the set-up guide in
[apps-script/README.md](../../apps-script/README.md).

Without the service URL (`NEXT_PUBLIC_QUOTE_API_URL`, GitHub variable `QUOTE_API_URL`) the site
runs in **demo mode**: same engine and Sheet snapshot, quotes kept in each browser.

## Limits

- The Click & Cargo handoff is a JSON download until an API is agreed.
- The example rows of `ROAD_LEGS` and `TEAMS`, and the `MaxGrossKg`/`VolumeM3` values, must be
  reviewed by the trainers.
