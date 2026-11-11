# Deployment

## Preview on GitHub Pages

The workflow `.github/workflows/deploy-pages.yml` is **manual only** (`workflow_dispatch`) and only
runs from `main`. Nothing is deployed automatically.

Before the first run, check the following:

1. **Visibility.** The repository is **public**. The owner decided this on 2026-11-11, so the
   preview can use GitHub Pages on the free plan. Code, audit evidence and preview are visible to
   anyone. Never commit secrets, personal data or material whose reuse rights are unconfirmed.
2. **Settings → Pages → Build and deployment → Source:** select _GitHub Actions_.
3. **Owner approval** for each preview deployment.

To run it: **Actions → Deploy preview to GitHub Pages → Run workflow** (branch `main`).

The expected preview URL is `https://portvirtuallab.github.io/sdg-railway-website/`. Record the
actual URL here after the first verified deployment.

Previews:

- are built with `NEXT_PUBLIC_BASE_PATH=/sdg-railway-website`;
- carry `noindex, nofollow` and a disallowing `robots.txt`;
- pass the internal link check before upload.

## Rollback

Each deployment is an immutable artifact. To roll back, re-run the deploy workflow from an earlier
commit (revert on `main`, then run), or disable Pages in Settings. The Google Sites website is never
changed by this repository, so it remains the fallback at all times.

## Production transition (Phase 8, needs owner approval)

The steps below are **not** to be done without explicit owner approval:

- choose and confirm the production domain (do not assume `www.sdgrailway.com`);
- add a `CNAME`, configure DNS and HTTPS;
- set `NEXT_PUBLIC_BASE_PATH=""`, `NEXT_PUBLIC_SITE_URL=<domain>` and
  `NEXT_PUBLIC_ALLOW_INDEXING=true`;
- update links in course materials, and add a notice on the Google Sites pages pointing to the new
  site. Google Sites cannot redirect.
