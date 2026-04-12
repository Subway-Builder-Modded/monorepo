# Releasing `@subway-builder-modded/special-demand-schemas`

Publishing is handled by the `publish-special-demand-schemas.yml` GitHub Actions
workflow. The workflow publishes to GitHub Packages when a
`special-demand-schemas-v*` tag is pushed.

## Release steps

1. Update the schema JSON files and validator code under `foundry/schemas/`.
2. Bump `foundry/schemas/package.json` using semver.
3. Verify the package locally from the repo root:

```bash
pnpm install --frozen-lockfile
pnpm --dir foundry/schemas run build
pnpm --dir foundry/schemas run test
npm pack --json --dry-run --cache foundry/schemas/.npm-cache
```

4. Create and push the namespaced tag:

```bash
git tag special-demand-schemas-v<version>
git push origin special-demand-schemas-v<version>
```

Example:

```bash
git tag special-demand-schemas-v0.1.0
git push origin special-demand-schemas-v0.1.0
```

The workflow verifies that the tag version matches
`foundry/schemas/package.json` before publishing.

## Consumer setup

Consumers need an `.npmrc` entry for the organization scope:

```ini
@subway-builder-modded:registry=https://npm.pkg.github.com
```

If the consuming environment needs authentication for package install, configure
the appropriate GitHub Packages token for that scope.
