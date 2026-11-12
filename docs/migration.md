# Migration

Evidence: [`docs/audit/`](audit/README.md) (source site reviewed on 2026-11-11).

## Page status

| Source page                                               | Target             | Status                                                                                           |
| --------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `/home`                                                   | `/` (and `/home/`) | Migrated: hero, introduction, key values, 8 services, quick access, fleet and quotation sections |
| `/about-us`                                               | `/about-us/`       | Migrated: team and departments, mission, vision, PVL role, compliance (reframed)                 |
| `/about-us/railway-general-sales-conditions`              | same               | Migrated: 20 clauses, disclaimer, download link                                                  |
| `/services`                                               | `/services/`       | Migrated: Gate In / Gate Out, searchable directory of 31 terminals with photos                   |
| `/services/container-and-trailer-packing`                 | same               | Migrated: inspection, 5 loading methods, weight distribution, securing. Load Planner links out   |
| `/services/railway-equipment-fleet`                       | same               | Migrated: 9 loading units, EURODUAL (source data flagged), T3000e and drawings                   |
| `/services/railway-equipment-fleet/our-locomotive-models` | same               | Migrated: 12 locomotives (hidden from menu, as in source; linked from Fleet and footer)          |
| `/services/dangerous-goods`                               | same               | Migrated: introduction (reframed), RID and Blue Skills resources                                 |
| `/network-routes`                                         | same               | Migrated: 13 corridors with country filter; Google My Maps map linked out                        |
| `/request-a-quotation`                                    | same               | Migrated: 4-step explanation, services, departures board. PIN gate links to the original page    |
| `/request-a-quotation/railway-dashboard`                  | same               | Migrated: text, image, link to the Apps Script quotation simulator                               |
| `/contact`                                                | same               | Migrated: scenario contact details (no live actions), real support links. Form links out         |
| `/resources`                                              | same               | Migrated: searchable glossary of 24 terms                                                        |

Still on the original site (linked from the new pages): the PVL PIN gate, the quotation simulator,
the contact form, the Load Planner and the interactive Google My Maps map.

## Change log

Substantive changes against the source, with reason. Approval: pending owner review.

| Date       | Page            | Change                                                                                                                          | Reason                               |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-11-12 | Home            | Hero uses the same locomotive photo without the text baked into the image; text is HTML                                         | Brief §11, readability on mobile     |
| 2026-11-12 | Home            | Introduction rewritten as scenario: removed "real-time visibility", "ERP integration", "environmental impact tracking" as facts | V-13                                 |
| 2026-11-12 | Home            | Testimonials section ("What our clients say") not migrated                                                                      | V-13: no invented customers as proof |
| 2026-11-12 | Home            | Service icons replaced by drawn line icons (source reused one icon on 5 of 8 cards)                                             | Consistency                          |
| 2026-11-12 | About Us        | ISO 9001/14001 "certified company" badges not shown; compliance text framed as what learners study                              | V-13: no real certification          |
| 2026-11-12 | Dangerous Goods | DG teams, coordinators and approvals described as simulated                                                                     | V-10                                 |
| 2026-11-12 | Services        | "TOLOUSE" displayed as Toulouse                                                                                                 | V-07                                 |
| 2026-11-12 | Locomotives     | "Greek earring" corrected to "Greek areté"                                                                                      | V-02                                 |
| 2026-11-12 | Fleet           | EURODUAL data kept verbatim with an "under review" notice                                                                       | V-01                                 |
| 2026-11-12 | Packing         | PlayPackaging shown as a Port Virtual Lab simulation partner; educational-guidance notice added                                 | Scenario labelling; V-17             |
| 2026-11-12 | Contact         | Placeholder email/phone shown as text, without mailto/tel links                                                                 | V-09                                 |
| 2026-11-12 | Quotation       | Departures board labelled as a scenario timetable (source said "Live schedule")                                                 | V-11                                 |

## Assets

107 unique source images were downloaded on 2026-11-12 (`scripts/audit/fetch-images.mjs`) and
published as WebP in `public/images/source/`. Originals are kept locally in
`docs/audit/source-images/` (not committed). Alt text lives in `src/content/image-alt.ts`.
Reuse rights are assumed to be the owner's and are still to be confirmed (asset register).
