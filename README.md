# SDG Railway website

Redesign of the website of **SDG Railway**, the simulated rail freight operator of
[Port Virtual Lab](https://pvl.one/), developed by
[Escola Europea – Intermodal Transport](https://escolaeuropea.eu/) for education and professional
training.

> **SDG Railway is an educational simulation. It does not provide real transport services.**
> Routes, terminals, fleet, contacts and conditions on this site are scenario content for
> learning exercises, unless explicitly marked as an external reference.

The current site lives on Google Sites
(`https://sites.google.com/escolaeuropea.eu/sdgrailway`) and **stays untouched** until the owner
approves a transition. This repository rebuilds it as an accessible, maintainable static site,
preserving its page hierarchy, content, images and learning workflows.

## Status

| Phase                                                           | State                                      |
| --------------------------------------------------------------- | ------------------------------------------ |
| 1. Audit, repository, documentation, CI                         | Done ([audit](docs/audit/README.md))       |
| 2. Brand tokens, components, header/footer                      | Skeleton in place; tokens provisional      |
| 3. Page content migration                                       | Not started; pages link to their originals |
| 4–8. Data, search, quotation, verification, preview, production | Not started                                |

Owner input needed: see [docs/audit/verification-log.md](docs/audit/verification-log.md).

## Relationship with PVL.ONE and Escola Europea

SDG Railway is one of the simulated companies of the Port Virtual Lab learning environment
(PVL.ONE). Learners use this site as an operational reference during rail and intermodal
exercises: terminals, equipment, packing, dangerous goods and simulated quotations. Escola Europea
– Intermodal Transport owns and manages the project.

## Technology

Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 4 · Vitest + Testing Library ·
Playwright + axe-core · ESLint · Prettier · GitHub Actions · GitHub Pages.
See [docs/architecture.md](docs/architecture.md) for the reasoning.

## Local development

Requirements: Node.js 20.9 or later (CI uses 22) and npm.

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command                                                       | What it does                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`                                                 | Development server                                                                          |
| `npm run build`                                               | Static export to `out/`                                                                     |
| `npm start`                                                   | Serve `out/` locally                                                                        |
| `npm run lint` · `npm run typecheck` · `npm run format:check` | Code quality                                                                                |
| `npm test`                                                    | Unit tests (Vitest)                                                                         |
| `npm run test:e2e`                                            | Browser and accessibility tests against `out/` (run `npx playwright install chromium` once) |
| `npm run check:links`                                         | Internal link and asset check on `out/`                                                     |

Build for GitHub Pages (served under `/sdg-railway-website`):

```bash
NEXT_PUBLIC_BASE_PATH=/sdg-railway-website npm run build
```

On Windows Git Bash, prefix with `MSYS_NO_PATHCONV=1` so the path is not rewritten.

## Deployment

Deployment to GitHub Pages is **manual** and limited to `main`: see
[docs/deployment.md](docs/deployment.md). Previews are not indexed by search engines.
No DNS, custom domain or redirect is configured without owner approval.

## Content management

Page structure lives in [`src/content/site-map.ts`](src/content/site-map.ts). Structured content
(terminals, routes, equipment, glossary) will live in `src/content` and `src/data` as typed data
with source URLs and review states: see [docs/content-model.md](docs/content-model.md).
Never edit `docs/audit/source-*` or `docs/audit/extracted`: they are the evidence of the original
site.

## Accessibility

Target: WCAG 2.2 AA. See [docs/accessibility.md](docs/accessibility.md).

## Reporting issues and contributing

Use the GitHub issue templates (bug report, content correction). See
[CONTRIBUTING.md](CONTRIBUTING.md) for branches, commits and pull requests.

## Future hosting

The site is plain static files in `out/` and can move to any static host. Set
`NEXT_PUBLIC_BASE_PATH` to empty and `NEXT_PUBLIC_SITE_URL` to the approved domain.

## Copyright and trademarks

© Escola Europea. Port Virtual Lab and related marks belong to their owners. The licence for this
repository and the site content is pending owner confirmation (see [LICENSE](LICENSE)). No
registered-trademark status is claimed for SDG Railway.
