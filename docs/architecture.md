# Architecture

## Decision: Next.js static export

The brief prefers Next.js with static export for GitHub Pages. We have adopted it because:

- **Static export** (`output: 'export'`) produces plain HTML/CSS/JS in `out/`. That needs no
  server and works on GitHub Pages or any static host.
- **React components** suit the interactive parts found in the audit: the network map, the load
  planner, the departures board, the quotation wizard and the glossary search. These can be
  rendered as small client components inside otherwise static pages.
- **TypeScript** keeps content data (terminals, routes, equipment) typed and validated.

Known static-export limits, and how we handle them:

| Limitation                                    | Handling                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No server, so no API routes or server actions | Forms validate in the browser. Submission goes only to an owner-approved endpoint (Apps Script, see `docs/audit/embedded-tools.md`) or produces a clearly labelled local summary. |
| No image optimisation service                 | `images.unoptimized`. Images are pre-sized at migration time (Phase 3).                                                                                                           |
| Sub-path hosting on GitHub Pages              | `basePath` and `assetPrefix` come from `NEXT_PUBLIC_BASE_PATH`, and `trailingSlash: true` gives each route its own `index.html`.                                                  |
| No redirects                                  | Source URLs live on Google Sites, so redirects there are not possible. A migration map is kept instead (`docs/migration.md`).                                                     |

Astro was the documented alternative. It was not needed, because no Next.js limitation blocks the
requirements.

## Structure

```
src/
  app/            Routes: home, catch-all for source pages, 404, sitemap, robots
  components/     Shared UI (header, footer, notice, breadcrumbs, page shell)
  content/        Site map and, later, migrated page content
  data/           Structured collections (terminals, routes, equipment, glossary) – Phase 4
  features/       Self-contained interactive tools (map, load planner, quotation) – Phase 5
  lib/            Pure helpers (site map queries, site config)
  styles/         Global CSS and design tokens
  types/          Shared TypeScript types
scripts/
  audit/          Reproducible extraction from the source site
  check-links.mjs Internal link checker for the static export
tests/
  unit/ integration/ e2e/
docs/
  audit/          Evidence of the original site (do not edit)
```

## Routing

`src/content/site-map.ts` is the single source of truth for pages, labels, hierarchy and
navigation. The catch-all route `src/app/[...slug]/page.tsx` generates one static page per entry,
plus `/home` as an alias of the homepage. Unknown paths are not generated (`dynamicParams = false`)
and fall through to the 404 page.

## Configuration

| Variable                     | Default                  | Purpose                                                   |
| ---------------------------- | ------------------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_PATH`      | empty                    | Sub-path when hosted at `/<repo>` on GitHub Pages         |
| `NEXT_PUBLIC_SITE_URL`       | GitHub Pages preview URL | Canonical URLs, Open Graph, sitemap                       |
| `NEXT_PUBLIC_ALLOW_INDEXING` | not set (no indexing)    | Set to `true` only for the owner-approved production site |
