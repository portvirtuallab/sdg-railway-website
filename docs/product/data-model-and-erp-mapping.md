# Data model and ERP mapping

## One source of data, one engine

```
Google Sheet (master data + register) ──► Apps Script web app (Code.gs + Engine.gs)
        ▲                                         │  JSON over HTTPS
        └──── QUOTE_LOG · BOOKINGS · HISTORY ◄────┤
                                                  ▼
                       Website (GitHub Pages): forms, network pages, My quotes
```

- **Master data** lives only in the Sheet tabs listed below. The website reads them live
  (`?action=catalogue`) and keeps a build-time snapshot (`src/data/sheet-snapshot.json`,
  `npm run sheet:snapshot`) for the first render and for when Google cannot be reached.
- **The engine** (`src/engine`) is the single implementation of routing, pricing, timetables,
  capacity, bookings and the handoff. `npm run build:apps-script` bundles it into `Engine.gs`. Its
  rail pricing is the v7 Apps Script logic ported one to one: `tests/unit/engine-parity.test.ts`
  replays the logged v7 quotes, and every quote from RWQ00000103 on matches to the cent.
- **The register** is written only by the Apps Script service, under a script lock.

## Master data (Sheet tabs read by `buildCatalogue`)

| Tab                   | Key columns                                                                                                | Used for                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `CONFIG`              | `Parameter`, `Value`                                                                                       | Currency, VAT, insurance, validity, prefixes, cut-off, capacity |
| `COUNTRIES`           | `CountryCode`, `CountryName`, `Status`                                                                     | Only `Active` countries can be chosen                           |
| `TERMINALS`           | `TerminalID`, `TerminalName`, `City`, `CountryCode`, `TerminalType`, `DGCapable`, `Active`                 | Directory, routing, DG routing                                  |
| `COUNTRY_CONNECTIONS` | `FromCountry`, `ToCountry`, `Active`                                                                       | Borders a route may cross                                       |
| `LINKS`               | `LinkID`, `FromTerminalID`, `ToTerminalID`, `DistanceKm`, `TimeMin`, `Active`, `CorridorTag`               | Route graph (Dijkstra, shortest distance or time); corridors    |
| `SERVICES`            | `ServiceID`, `ServiceName`, `ServiceLevel`, `SpeedKmH`, `DGAllowed`, `Active`                              | Services compared in the quote                                  |
| `SCHEDULES`           | `ServiceID` (optionally `ID:ES→FR`), `DepartureDays`, `DepartureTime`, `BlockedDates`, `SlotsPerDeparture` | Departures, blocked days, capacity                              |
| `UTI_TYPES`           | `UTICode`, `UTIName`, `Category`, `MaxGrossKg`, `VolumeM3`                                                 | Loading units, weight and volume checks, reefer                 |
| `ADR_CLASSES`         | `ClassCode`, `ClassName`                                                                                   | Dangerous goods classes offered                                 |
| `TARIFFS`             | `ServiceID`, `UTIType`, `FixedFee`, `RatePerKm`, `MinCharge`, `Active`                                     | Rail freight = max(fixed + km × rate, minimum) × units          |
| `SURCHARGES`          | `SurchargeCode`, `Label`, `AmountType`, `Amount`, `Rule`, `ApplyPer`, `Active`                             | Rule-based surcharges (DG, border, long haul, terminal…)        |
| `ROAD_LEGS`           | `PlaceID`, `PlaceName`, `CountryCode`, `TerminalID`, `DistanceKm`, `Price`, `TransitHours`                 | Play Haulier first and last mile (door ↔ terminal)              |
| `TEAMS` (private)     | `PIN`, `TeamName`, `Role`, `Active`                                                                        | PIN check on every call; trainer role sees all teams            |

## Register (written by the service)

| Tab         | One row per    | Main columns                                                                                                                                                                                                             |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `QUOTE_LOG` | Quote version  | v7 columns (route, service, unit, base, surcharges, total, `BreakdownJSON` = full quote, `Status`, `PdfFileId`) + `Version`, `TeamPIN`, parties, places, ready date, train, delivery, road total, validity, `BookingRef` |
| `BOOKINGS`  | Accepted quote | `BookingRef`, `QuoteRef`, `Version`, `TeamPIN`, `Status`, `TrainID`, departure/cut-off/arrival, units, terminal orders, `HandoffJSON`                                                                                    |
| `HISTORY`   | Action         | `Timestamp`, `Action` (QUOTE, ACCEPT, ORDERS), `Ref`, `Version`, `TeamPIN`, `Details`                                                                                                                                    |

Quote statuses: `ISSUED` → `ACCEPTED` or `SUPERSEDED` (a new version was issued); expired is
computed from `ValidUntil`. Rows from v7 (`NEW`) are kept untouched.

## Transactions (engine types, `src/engine/quote.ts`)

| Record              | Fields                                                                                                                                                                                                                  | Rules                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Quote** (RWQ)     | `ref` `RWQ00000000`, `version`, `status`, `issuedAt`, `expiresAt`, `team`, `request`, `route` (path, countries, km, transit), `service`, `legs[]`, `lines[]`, `rail`, `roadTotal`, `total`, `train`, `deliveryEstimate` | Total = sum of lines; the cheapest terminal combination is used when a door is served by several terminals |
| **Leg**             | `kind` (origin-road, origin-terminal, rail, destination-terminal, destination-road), `from`, `to`, `provider`, `scope`, `note`                                                                                          | Road legs excluded in terminal-to-terminal offers                                                          |
| **Train proposal**  | `status` (proposed, pending), `trainId` (`service                                                                                                                                                                       | origin terminal                                                                                            | date`), `departure`, `cutOff`, `arrival`, `slotsLeft`, `reason` | Never invented: pending when no departure with room exists within `TrainSearchDays` |
| **Booking** (RWB)   | `ref` `RWB00000000`, `quoteRef`, `quoteVersion`, `status` (confirmed, pending-train), `createdAt`, `train`, `terminalOrders`                                                                                            | Created only from an issued quote; capacity re-checked at acceptance                                       |
| **Terminal orders** | `deliveryDriver`, `deliveryVehicle`, `collectionDriver`, `collectionVehicle`                                                                                                                                            | Feed gate-in and gate-out orders                                                                           |

## Click & Cargo handoff – `sdg-railway.handoff/v2`

Produced by `src/engine/handoff.ts`, stored in `BOOKINGS.HandoffJSON` and downloadable from My
quotes and bookings. `readyForErp` is false (and the download blocked) until the booking has a
confirmed train.

| Handoff field                              | Source         | Proposed Click & Cargo field (to agree with the ERP team)                                     |
| ------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| `references.quote`, `quoteVersion`         | Quote          | Supplier quotation number                                                                     |
| `references.booking`                       | Booking        | Supplier booking reference                                                                    |
| `service`                                  | Quote          | Rail service                                                                                  |
| `parties.customer`                         | Team           | Forwarder (own company)                                                                       |
| `parties.shipper`, `parties.consignee`     | Request        | Shipper, consignee                                                                            |
| `parties.intermodalCarrier`, `roadHaulier` | Quote          | Supplier, subcontracted haulier                                                               |
| `incoterm`                                 | Request        | Incoterm                                                                                      |
| `cargo.*`                                  | Request        | Goods description, gross weight, packages, UTI type and quantity, ADR class / UN, temperature |
| `route.*`, `legs[]`                        | Quote          | Origin, terminals, rail path and km, destination, legs with scope                             |
| `prices[]`, `total`, `currency`            | Quote lines    | Supplier cost lines (selling price and margin are set in the ERP)                             |
| `train.*`                                  | Booking        | Train, departure, cut-off, arrival                                                            |
| `dates.*`                                  | Request, quote | Ready date, quote issue and expiry, estimated delivery                                        |
| `terminalOrders.*`                         | Booking        | Delivery and collection orders (driver, vehicle registration)                                 |
| `documents[]`                              | Quote, booking | Attachments list                                                                              |

## Web app API (`apps-script/src/Code.gs`)

| Call                      | Input                       | Output                                                  |
| ------------------------- | --------------------------- | ------------------------------------------------------- |
| `GET ?action=catalogue`   | –                           | Public tabs (no `TEAMS`, no `PdfFolderId`, no register) |
| `GET ?action=health`      | –                           | `{ ok, version }`                                       |
| `POST {action:'options'}` | Request                     | Price and first train per service (not recorded)        |
| `POST {action:'quote'}`   | Request (+ `requote.ref`)   | Quote and PDF link, or errors                           |
| `POST {action:'accept'}`  | `pin`, `ref`, `version`     | Booking, accepted quote, handoff                        |
| `POST {action:'orders'}`  | `pin`, `bookingRef`, orders | `{ ok }`                                                |
| `POST {action:'list'}`    | `pin`                       | Team, quotes and bookings (all teams for a trainer PIN) |

POST bodies are sent as `text/plain` JSON so browsers make a simple request (Apps Script does not
answer CORS preflights). The PIN is checked against `TEAMS` on every call that reads or writes
team data.
