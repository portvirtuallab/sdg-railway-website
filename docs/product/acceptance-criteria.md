# Acceptance criteria

From the brief (§4 table and §7), with the automated check that verifies each one.
Unit tests: `tests/unit/quote-engine.test.ts`. Browser tests: `tests/e2e/quote-journey.spec.ts`
and `tests/e2e/pages.spec.ts`.

| #   | Criterion                                                                                                            | Verified by                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **RWQ and booking** are both visible, distinct, persistent and present in the PDF and export                         | Unit: “keeps the quote and booking references distinct and linked”; e2e: worked example journey (status message, My quotes table, handoff download) |
| A2  | **Train**: a verifiable ID and date, or a pending state that prevents continuation                                   | Unit: “proposes the first train…”, “shows a pending train when capacity is full, and blocks the ERP handoff”                                        |
| A3  | **Price**: total equals the applicable line items, with no duplicates or empty charges                               | Unit: “total always equals the line items…”, “takes terminal handling from exactly one source”                                                      |
| A4  | **Scope**: road legs and terminals marked included, excluded or pending                                              | Unit: “marks road legs excluded for terminal-to-terminal…”; quote document shows a scope badge per leg                                              |
| A5  | **ERP**: the student can reproduce the operation without contradictory re-entry                                      | Handoff carries references, parties, ITU, route, legs, prices, dates, train and terminal orders (unit: “exports a complete Click & Cargo handoff”)  |
| A6  | **Errors**: invalid PIN, uncovered route, incompatible ITU and unavailable train are explained without a false offer | Unit: validation suite (“throws instead of pricing an invalid request”); e2e: “explains errors instead of producing a false offer”                  |
| A7  | Worked example reproduces the brief's arithmetic (€180 + 45 + 420 + 45 + 160 + 40 = €890) from versioned DEMO data   | Unit: “reproduces the illustrative arithmetic: €890”; e2e: total €890.00 on screen                                                                  |
| A8  | A quote is not a booking: acceptance creates the booking; an expired quote cannot be accepted                        | Unit: “cannot accept an expired quote”                                                                                                              |
| A9  | Simulation notice on every page and on the PDF                                                                       | e2e: every page shows the notice; `QuoteDocument` prints its own notice                                                                             |
| A10 | Accessible: keyboard, visible focus, labelled fields, announced errors, no serious axe violations (WCAG 2.2 AA)      | e2e: axe on every page and on the quote result                                                                                                      |
| A11 | Every original page and URL still exists                                                                             | Unit: “keeps all 13 source pages…”, “keeps every source URL path unchanged”                                                                         |

## Manual checks before a session

- Generate the worked example, print it to PDF and compare with the trainer's reference.
- Accept three one-unit quotes for the same Green Rail departure (2 slots) to see the pending-train state on the third.
- Check the handoff JSON against the Click & Cargo field mapping.
