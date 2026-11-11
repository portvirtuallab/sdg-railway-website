# Contributing

Everything in this repository is written in international English: code, comments, docs, issues,
commits and pull requests.

## Branches

| Branch           | Purpose                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `main`           | Approved, deployable code. Protected; changes arrive by pull request from `develop`. |
| `develop`        | Integrated development. Feature branches start here.                                 |
| `feature/<name>` | One feature, e.g. `feature/terminal-directory`                                       |
| `fix/<name>`     | One fix                                                                              |
| `content/<area>` | Larger content updates, e.g. `content/equipment-fleet`                               |

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) and keep them small and
reviewable:

```
feat: add searchable terminal directory
fix: correct equipment image aspect ratio
content: migrate dangerous goods page
docs: add GitHub Pages deployment guide
test: add quotation form validation tests
```

## Pull requests

Fill in the template: summary, related issue, screenshots, tests, accessibility and responsive
checks, content integrity and known limitations. CI must pass.

## Content rules

- Preserve the source site's meaning and detail. Record every substantive rewrite, merge or
  removal in `docs/migration.md`.
- Do not invent routes, frequencies, tariffs, specifications, capacities, contacts, customers,
  testimonials, certificates or emissions results.
- Unknown values stay `null` in data with `reviewState: 'needs-review'`.
- Scenario content must be identifiable as such; external references must cite their source and
  date.
- Only use images with confirmed reuse rights. Record each in `docs/audit/asset-register.csv`.
