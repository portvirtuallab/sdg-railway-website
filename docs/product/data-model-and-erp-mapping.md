# Data model and ERP mapping

## Catalogue (master data) – `src/data/demo-catalogue.json`

Versioned (`version`, `validFrom`, `validTo`, `status: demo`). In production this is the master
copy kept in the SDG Railway Google Sheet and read by the website at build time.

| Collection          | Key fields                                                                                                                                                             | Notes                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `terminals`         | `id`, `city`, `country`, `name`, `dgCapable`, `source`                                                                                                                 | Ids match the terminal directory                                                   |
| `services`          | `id` (STD-RAIL, EXP-RAIL, GRN-RAIL), `name`, `trainName`, `speedKmh`, `dangerousGoods`, `blockedDates`                                                                 | From the Departures Board                                                          |
| `lanes`             | `id`, `from`, `to`, `serviceId`, `distanceKm`, `transitHours`, `train {id, days, departure, slotsPerDeparture}`, `acceptedItus`, `railRates {ITU: amount}`, `teaching` | One direct terminal-to-terminal train per lane; rates per ITU                      |
| `itus`              | `code`, `name`, `teu`, `maxGrossKg`, `volumeM3`, `reefer?`, `p400?`                                                                                                    | Learning values to confirm                                                         |
| `doors`, `roadLegs` | `door`, `terminal`, `amount`, `hours`                                                                                                                                  | Play Haulier first and last legs, per ITU                                          |
| `charges`           | `terminalHandling {default, byCountry, byTerminal}`, `managementFee`, `dangerousGoodsPerItu`, `reeferPowerPerItu`, `insuranceRate`, `insuranceMinValue`                | Terminal handling resolves to exactly **one** source: terminal → country → default |
| `teams`             | `pin`, `team`, `role` (student / trainer)                                                                                                                              | Demo PINs; real PINs live in the back end                                          |

## Transactions

| Record              | Fields                                                                                                                                                                                                                                                                                        | Rules                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Quote** (RWQ)     | `ref` `RWQ-YYYY-NNNNN`, `version`, `status` (issued, accepted, expired, superseded), `issuedAt`, `expiresAt`, `catalogueVersion`, `team`, `request`, `laneId`, `route`, `legs[]`, `lines[]`, `total`, `currency`, `inclusions[]`, `exclusions[]`, `conditions[]`, `train`, `deliveryEstimate` | Total = sum of lines; no duplicate or zero lines; a new version supersedes the previous one; expiry ≤ catalogue validity |
| **Leg**             | `kind` (origin-road, origin-terminal, rail, destination-terminal, destination-road), `from`, `to`, `provider`, `scope` (included, excluded, pending), `note`                                                                                                                                  | Road legs excluded in terminal-to-terminal offers                                                                        |
| **Train proposal**  | `status` (proposed, pending), `trainId`, `serviceName`, `departure`, `cutOff`, `arrival`, `reason`                                                                                                                                                                                            | Never invented: pending when no departure with free slots exists within 14 days or the catalogue ends                    |
| **Booking** (RWB)   | `ref` `RWB-YYYY-NNNNN`, `quoteRef`, `quoteVersion`, `status` (confirmed, pending-train), `createdAt`, `train`, `terminalOrders`                                                                                                                                                               | Created only by accepting an issued quote; capacity re-checked at acceptance                                             |
| **Terminal orders** | `deliveryDriver`, `deliveryVehicle`, `collectionDriver`, `collectionVehicle`                                                                                                                                                                                                                  | Feed gate-in and gate-out orders                                                                                         |

## Click & Cargo handoff – `sdg-railway.handoff/v1`

Produced by `src/features/quote/handoff.ts`; downloadable as JSON from My quotes and bookings.
`readyForErp` is false (and the download blocked) until the booking has a confirmed train.

| Handoff field                              | Source         | Proposed Click & Cargo field (to agree with the ERP team)                                    |
| ------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------- |
| `references.quote`, `quoteVersion`         | Quote          | Supplier quotation number                                                                    |
| `references.booking`                       | Booking        | Supplier booking reference                                                                   |
| `parties.customer`                         | Team           | Forwarder (own company)                                                                      |
| `parties.shipper`, `parties.consignee`     | Request        | Shipper, consignee                                                                           |
| `parties.intermodalCarrier`, `roadHaulier` | Quote          | Supplier, subcontracted haulier                                                              |
| `incoterm`                                 | Request        | Incoterm                                                                                     |
| `cargo.*`                                  | Request        | Goods description, gross weight, packages, ITU type and quantity, DG class / UN, temperature |
| `route.*`, `legs[]`                        | Quote          | Origin, terminals, destination, legs with scope                                              |
| `prices[]`, `total`, `currency`            | Quote lines    | Supplier cost lines (selling price and margin are set in the ERP)                            |
| `train.*`                                  | Booking        | Train ID, departure, cut-off, arrival                                                        |
| `dates.*`                                  | Request, quote | Ready date, quote issue and expiry, estimated delivery                                       |
| `terminalOrders.*`                         | Booking        | Delivery and collection orders (driver, vehicle registration)                                |
| `documents[]`                              | Quote, booking | Attachments list                                                                             |

## Back-end contract (to implement in Apps Script)

| Call                  | Input                                      | Output                                             |
| --------------------- | ------------------------------------------ | -------------------------------------------------- |
| `GET catalogue`       | –                                          | Catalogue JSON (published at build time)           |
| `POST quote`          | Request (+ previous ref for a new version) | Quote or errors (same codes as the prototype)      |
| `POST accept`         | `ref`, `version`                           | Booking (confirmed or pending-train)               |
| `POST terminalOrders` | `bookingRef`, orders                       | Updated booking                                    |
| `GET quotes?pin=`     | Team PIN                                   | Quotes and bookings of the team (all for trainers) |

Every call is recorded in the Sheet's operations tab. The PIN is checked server-side on each call.
