# Review of the current Railway quoter (Apps Script, v7)

Reviewed on 2026-11-19 from the code the owner pasted (Code.gs, Schedulesystem.gs, Index.html,
app.js.html, styles.css.html, QuotePdf.html) and an export of the bound Google Sheet
"Railway_Quotation_System_v7_FIXED(Nombre)_Servicio" (210 rows in QUOTE_LOG).
The script is bound to the Sheet and published as a web app; PDFs go to the Drive folder named in
CONFIG `PdfFolderId`.

## What each file does

| File              | Role                                                                                          | In use |
| ----------------- | --------------------------------------------------------------------------------------------- | ------ |
| Code.gs           | Web app entry (`doGet`), bootstrap data, quote engine, PDF, QUOTE_LOG, sheet menu             | Yes    |
| Schedulesystem.gs | Reads SCHEDULES (`apiGetScheduleData`) and checks the date on the server (`isDateAvailable_`) | Yes    |
| Index.html        | The 5-step form (route, cargo, service and date, contact, review) and the result panel        | Yes    |
| app.js.html       | Front-end logic of the form and calendar                                                      | Yes    |
| styles.css.html   | Form styles                                                                                   | Yes    |
| QuotePdf.html     | PDF template                                                                                  | Yes    |

## How a price is calculated (to be kept identical)

1. **Route:** Dijkstra over active LINKS, undirected. Terminals must be active; for dangerous goods
   every terminal on the path must be `DGCapable`. A cross-border link is allowed only if the country
   pair is in COUNTRY_CONNECTIONS (either direction). Metric is DISTANCE or TIME, chosen by the user.
2. **Transit:** sum of link `TimeMin`; if missing, distance / service speed.
3. **Tariff:** TARIFFS row for ServiceID + UTIType (fallback `ANY`).
   Base freight = max(FixedFee + km × RatePerKm, MinCharge) × units.
4. **Surcharges:** every active SURCHARGES row whose `Rule` matches (conditions joined by `;`,
   operators `= != >= <= > < ~ ^=`). Percent rows apply to base freight; `ApplyPer=unit` multiplies by
   units. Families `DOCS-`, `TERM-TAX-O-`, `TERM-TAX-D-`, `RAIL-HDL-O-`, `RAIL-HDL-D-` are meant to
   apply only their first match.
5. **Insurance:** goods value × InsuranceRate, only if requested and value ≥ MinInsuranceValue.
6. **VAT:** subtotal × VATRate (currently 0).
7. **Date:** must be inside the SCHEDULES rules (GLOBAL holidays, departure days, blocked dates;
   route-specific rows such as `STD-RAIL:ES→FR`).

## Problems found

| #   | Problem                                                                         | Effect                                                                                        | Fix                                                         |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | SURCHARGES cell A1 is empty (should be `SurchargeCode`)                         | Codes are lost: the PDF shows "()" after each surcharge, and first-match families do not work | Type `SurchargeCode` in A1                                  |
| 2   | Menu "Setup / Repair Sheets" clears any tab whose headers differ                | With problem 1, pressing it **wipes SURCHARGES**                                              | Fix A1 first; avoid the menu                                |
| 3   | No lock when numbering quotes                                                   | 7 duplicate references (RWQ00000173 five times, with five PDFs)                               | `LockService` around numbering and logging                  |
| 4   | GREEN-DISC rule is `SERVICE_LEVEL=GREEN`, service level is now `Economy`        | The −5 % eco discount stopped applying                                                        | Change the rule to `SERVICE_LEVEL=ECONOMY` (changes prices) |
| 5   | Booking reference is a random number made in the browser, never saved           | PDF "Booking ref" is blank; the class cannot track bookings                                   | Server-side bookings                                        |
| 6   | Departure date, contact name and cargo description are not written to QUOTE_LOG | Cannot check what was booked for which day                                                    | Add columns                                                 |
| 7   | Company is free text                                                            | 100+ spellings of the same teams                                                              | Access code list                                            |
| 8   | `clearServerCache` clears config only, not the schedule cache                   | SCHEDULES edits take up to 60 s to show                                                       | Clear both keys                                             |
| 9   | TARIFFS has a second, different price table in columns L–O                      | Unclear which prices are official (the engine uses A–H)                                       | Owner to confirm, then delete or move                       |
| 10  | Index.html polls the state every 200 ms                                         | Wasted work in the browser                                                                    | Update the card when the date changes                       |
| 11  | Train names in app.js include a real brand ("Eurostar")                         | Possible brand confusion                                                                      | Use neutral names                                           |

## Status (2026-11-19)

Implemented on the branch `feature/sheet-backend`: problems 1, 3, 5, 6, 7, 8, 10 and 11 are solved by
the v8 service and website; 2 is solved by Setup v8 (it fixes A1 and never clears a tab); 4 and 9
are left to the trainers because they change prices or data (see
[outstanding-business-data.md](outstanding-business-data.md)). Set-up guide:
[apps-script/README.md](../../apps-script/README.md).
