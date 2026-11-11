# Content model

Every record keeps three things separate: **source facts** (as found on the original site),
**approved scenario data** (confirmed by the owner for exercises) and **proposed enhancements**.
Raw source values stay in `docs/audit/extracted/` and are never overwritten.

## Review states

| State          | Meaning                                                   | Published?                                               |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `source`       | Taken from the original site, not yet reviewed            | Yes, as on the original                                  |
| `needs-review` | Conflicting, unclear or unverified (see verification log) | Only as clearly labelled scenario content, or not at all |
| `approved`     | Confirmed by the owner or a subject expert                | Yes                                                      |
| `proposed`     | New content suggested during the redesign                 | No, until approved                                       |

## Collections

Implemented:

- **Pages** (`src/content/site-map.ts`, type `SitePage`): `id`, `label`, `path`, `sourceUrl`,
  `parentId`, `inNav`, `description`, `reviewState`.

Planned for Phase 4. The fields follow brief §16 and the audit findings.

- **Terminal**: `id`, `slug`, `sourceName`, `displayName`, `aliases[]` (e.g. _Morrot_ / _Can
  Tunis_, V-03), `scenarioCountry`, `city`, `coordinates | null`, `coordinatesBasis`
  (`verified` | `illustrative`), `dangerousGoods` (as marked in the source), `image`, `sourcePage`,
  `reviewState`.
- **Route / corridor**: `id`, `name`, `terminalIds[]` (ordered), `geometry` (from the KML),
  `services[]`, `source` (`map` | `departures-board`), `reviewState`. Connectivity is never
  inferred from terminal membership.
- **Rail service**: `id` (`STD-RAIL`, `EXP-RAIL`, `GRN-RAIL`), `name`, `speedKmh`,
  `dangerousGoodsAllowed`, `operatingDays`, `departureTime`, `blockedDates`. Source: the
  Departures Board embed.
- **Equipment**: `id`, `model`, `variant`, `type` (locomotive | wagon | ITU), `images`,
  `specifications[]` of `{ label, value, unit, source, reviewState }`, `compatibleLoadingUnits`,
  `rawSource` (verbatim, for V-01).
- **Locomotive**: `id`, `name`, `virtue`, `evn` (e.g. `E-PRS 9 5 71 0 201 501 4`), `region`,
  `description`.
- **Glossary entry**: `id`, `term`, `definition`, `related[]`.
- **Asset**: the columns of `docs/audit/asset-register.csv`.
- **Legal notice / download**: `id`, `title`, `version`, `file`, `sourceUrl`, `disclaimer`.

Schemas will be TypeScript types, validated by unit tests (unique ids, valid references, units
present for every numeric specification).
