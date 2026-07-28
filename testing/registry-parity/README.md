# registry-parity

Drift guard between vocabulary re-declared in this repo and the registry's
published schemas package (`@subway-builder-modded/registry-schemas`).

The app and website intentionally re-declare registry vocabulary rather than
importing the schemas package at runtime (see the note in
`packages/config/src/asset-listings/map-filter-values.ts`). These tests keep
that decoupling honest:

- `LOCATION_TAGS` (map filters) must equal the registry `LocationTagSchema`.
- `DATA_QUALITY_TIER_VALUES` must equal the registry `DATA_QUALITY_TIERS`.
- Every country on the website's region-tags docs page must sit in the region
  the registry's `COUNTRY_TO_LOCATION` derives from its country code.

## Why this lives outside the pnpm workspace

GitHub Packages requires authentication even for public packages. Keeping this
package standalone (own install, own `.npmrc`, dependency on the schemas
package tracking `latest`, no committed lockfile) means the main workspace
`pnpm install` never needs a token — only this package's install does. CI runs
it with the built-in `GITHUB_TOKEN` (`.github/workflows/registry-parity.yml`,
on relevant PRs plus a weekly schedule so registry-side changes surface too).

## Running locally

Requires a token with `read:packages`:

```sh
cd testing/registry-parity
NODE_AUTH_TOKEN=<token> pnpm install
pnpm test
```

If a parity test fails, reconcile the re-declared values with the registry
(the registry is the source of truth) or, if the registry is wrong, fix it
there and republish the schemas package.
