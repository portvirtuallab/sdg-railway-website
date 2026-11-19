# Port Railway migration and redirect plan

**Status:** draft. `www.portrailway.com` could not be inventoried on 2026-11-19 (HTTPS: no
response; HTTP: server error 500). This plan is based on the brief's description: Port Railway
lists services, equipment, corridors, schedules and quotations, mixes names, contains placeholder
schedule text and makes absolute commercial claims.

## Decision needed first (brief §2, P0)

Product decides whether Port Railway becomes:

1. **A redirect to SDG Railway** (recommended): one identity, one quotation flow; or
2. **A service line of SDG Railway**, presented inside this website with its own name.

Two identities must not be published side by side before that decision.

## Steps (for option 1)

| Step | Action                                                                                                      | Notes                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Inventory every Port Railway URL, image and document once the site responds                                 | Same audit method as `docs/audit/`                                                                                                       |
| 2    | Map each URL to its SDG Railway equivalent                                                                  | Services → Equipment and cargo; Corridors / schedules → Network and trains; Quotation → Get a quote; Equipment → Railway Equipment Fleet |
| 3    | Keep useful content only after review                                                                       | Drop placeholder schedules and absolute claims (brief §7)                                                                                |
| 4    | Publish SDG Railway on the approved domain                                                                  | Requires the domain decision                                                                                                             |
| 5    | Configure 301 redirects on the Port Railway server (Apache), page by page, with a catch-all to the homepage | Port Railway runs on Apache/PHP, so redirects are possible there, unlike Google Sites                                                    |
| 6    | Update links in course materials and PVL.ONE                                                                | Teaching team                                                                                                                            |
| 7    | Monitor for one term, then retire the old site                                                              | Keep a backup                                                                                                                            |

## Rollback

Disable the redirects on the Port Railway server; the SDG Railway preview remains independent.
