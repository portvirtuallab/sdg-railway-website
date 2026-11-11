# Testing

| Layer                      | Tool                                       | Location                               | Runs in CI |
| -------------------------- | ------------------------------------------ | -------------------------------------- | ---------- |
| Formatting                 | Prettier                                   | whole repo except audit evidence       | yes        |
| Lint                       | ESLint (`eslint-config-next`)              | `src`, `tests`, configs                | yes        |
| Types                      | `tsc --noEmit`                             | everything in `tsconfig.json`          | yes        |
| Unit                       | Vitest + Testing Library (jsdom)           | `tests/unit`                           | yes        |
| Integration                | Vitest                                     | `tests/integration` (Phase 4+)         | yes        |
| Build + links              | `next build` + `scripts/check-links.mjs`   | `out/` with the GitHub Pages base path | yes        |
| End-to-end + accessibility | Playwright + axe-core, desktop and Pixel 7 | `tests/e2e`                            | yes        |

## Running locally

```bash
npm test
npm run build && npm run check:links
npx playwright install chromium   # first time only
npm run test:e2e                  # serves out/ on port 4173
```

The end-to-end tests expect `out/` to be built **without** a base path.

## What the current tests guarantee

- All 13 source pages exist, with unique ids and paths and the original paths and navigation order.
- Hidden source pages stay out of the menu. The legacy `/home` path works.
- Every page returns 200 and has one `h1`, a visible simulation notice and no serious axe
  violations.
- The skip link, the submenu keyboard behaviour and the 404 page work.
- Design token contrast meets AA.
