# website-dev Cleanup and Refactor Audit

Date: 2026-05-30  
Scope audited: `website-dev`, shared UI/component packages, and root quality configs.

## 1. Current architecture summary

- `website-dev` is primarily feature-first under `src/features/*`, with cross-feature code in `src/shared/*`, `src/hooks/*`, and `src/config/*`.
- Routing is custom SPA routing in `src/lib/router.tsx` plus route matchers per feature, then composed centrally in `src/app.tsx`.
- Shared package adoption is already substantial:
  - `@subway-builder-modded/shared-ui` is used broadly for primitives and composed UI.
  - `@subway-builder-modded/mdx` is used as a base MDX layer.
  - `@subway-builder-modded/config` is used, but `website-dev` still keeps significant parallel config in `src/config/site-navigation.tsx` and feature-local config.
- Styling architecture is token/scheme based:
  - Global styles in `src/styles/global.css`.
  - Per-suite schemes in `src/styles/schemes/*.css`.
- Shared packages are organized by domain (`shared-ui`, `asset-listings-ui`, `mdx`, `config`, etc.), but there is overlap between website-local components and package-level components.

## 2. Duplicate or similar components that can be consolidated

1. Registry search UIs are duplicated in behavior and internals:
	- `website-dev/src/features/registry/components/registry-search.tsx`
	- `website-dev/src/features/registry/components/registry-spotlight-search.tsx`
	- Search mode of `website-dev/src/features/registry/components/registry-toolbar-dropdown.tsx`
	- Similar package primitive: `packages/asset-listings-ui/src/components/search-bar.tsx`

2. Registry sorting controls overlap package sort control:
	- `website-dev/src/features/registry/components/registry-sort-bar.tsx`
	- `website-dev/src/features/registry/components/registry-toolbar-dropdown.tsx`
	- Similar package primitive: `packages/asset-listings-ui/src/components/sort-select.tsx`

3. View mode toggles overlap strongly:
	- `website-dev/src/features/registry/components/registry-view-toggle.tsx`
	- Similar package primitive: `packages/asset-listings-ui/src/components/view-mode-toggle.tsx`

4. Sidebar filter systems overlap conceptually:
	- `website-dev/src/features/registry/components/registry-filter-sidebar.tsx`
	- Similar package primitive: `packages/asset-listings-ui/src/components/sidebar-filters.tsx`

5. Pagination duplication exists across packages and local usage patterns:
	- `packages/shared-ui/src/components/pagination.tsx`
	- `packages/shared-ui/src/components/styled-pagination.tsx`
	- `packages/asset-listings-ui/src/components/pagination.tsx`

6. Registry card implementations overlap in goals but diverge in API:
	- `website-dev/src/shared/registry-card/registry-item-card.tsx` (795 lines)
	- `packages/asset-listings-ui/src/components/item-card.tsx` (639 lines)

7. MDX adapter/wrapper duplication is high:
	- `website-dev/src/features/content/mdx/*`
	- `website-dev/src/features/docs/mdx/*`
	- `packages/mdx/src/components/*` and `packages/mdx/src/remark/*`
	- Several files are pass-through wrappers around package exports.

8. Navigation composition exists in two systems:
	- `website-dev/src/config/site-navigation.tsx` and `src/shared/navigation/*`
	- `packages/config/src/navbar/content.ts` (used by `website`, not by `website-dev`)

## 3. Code that should move from website-dev into packages

1. Registry search/sort/filter/view controls (or lower-level composable primitives).
	- Candidate local sources:
	  - `website-dev/src/features/registry/components/registry-search.tsx`
	  - `website-dev/src/features/registry/components/registry-sort-bar.tsx`
	  - `website-dev/src/features/registry/components/registry-toolbar-dropdown.tsx`
	  - `website-dev/src/features/registry/components/registry-view-toggle.tsx`
	  - `website-dev/src/features/registry/components/registry-type-toggle.tsx`
	- Target package: `packages/asset-listings-ui` (or shared package split if needed).

2. Registry card normalization/preview/tag logic.
	- Candidate local source: `website-dev/src/shared/registry-card/registry-item-card.tsx`
	- Target package: `packages/asset-listings-ui` to avoid maintaining two card engines.

3. Site navigation data model and route match helpers (if both website surfaces should share one model).
	- Candidate local source: `website-dev/src/config/site-navigation.tsx`
	- Existing package home: `packages/config/src/navbar/*`
	- Recommendation: converge on one canonical navbar model with website-specific extensions as overrides.

4. Reusable MDX adapter layer.
	- Candidate local source: `website-dev/src/features/content/mdx/components.tsx` plus docs MDX wrappers.
	- Target package: `packages/mdx` (add explicit adapter factory points for docs/updates).

5. Optional: custom router utility (only if reused by other SPA packages).
	- Candidate local source: `website-dev/src/lib/router.tsx`
	- Keep local unless another app (`website`, `railyard/frontend`) adopts same router pattern.

## 4. Code that should stay local to website-dev (with reasons)

1. Feature content orchestration and route semantics.
	- Examples: `features/docs/lib/*`, `features/updates/lib/*`, `features/registry/detail/*`.
	- Reason: tied to website-dev URL structure, content ownership, and page behavior.

2. Suite branding and copy tied to website-dev IA.
	- Example: `src/config/site-navigation.tsx` descriptions, suite titles, and route map.
	- Reason: product-surface copy and IA are website-specific, not generic primitives.

3. Highly specific experience components.
	- Examples: `features/markdown-playground/page.tsx`, `features/depot/components/*`, `features/home/components/*`.
	- Reason: feature storytelling and product page composition are app-local.

4. Content datasets under `website-dev/content/*` and generated public registry snapshots.
	- Reason: domain data, docs, changelogs, and snapshots belong to this site surface.

## 5. Deletion candidates (with confidence)

1. `website-dev/coverage/*` artifacts.
	- Confidence: High.
	- Why: generated output already ignored by `.gitignore`.

2. `website-dev/build/client/*` artifacts.
	- Confidence: High.
	- Why: build output directory, ignored by `.gitignore`.

3. `website-dev/dist/assets/*`, `website-dev/dist/index.html`, `website-dev/dist/favicon.ico`, `website-dev/dist/logo.png`.
	- Confidence: Medium.
	- Why: appears to be generated output; keep only intentional placeholder marker (`.gitkeep`) if needed.

4. Potentially unused exports flagged by static scan (requires verification before deletion).
	- Examples:
	  - `website-dev/src/hooks/use-theme-mode.ts` -> `getThemeBootScript`
	  - `website-dev/src/features/registry/registry-content.ts` -> `REGISTRY_LOADING_MESSAGE`
	  - `website-dev/src/features/railyard/railyard-downloads.ts` -> `getRailyardDefaultDownloadOverride`, `shouldShowArchitectureOverride`
	- Confidence: Medium-Low until usage checks include non-TS references and future plans.

5. Pass-through MDX wrapper modules that only re-export package symbols.
	- Examples:
	  - `website-dev/src/features/content/mdx/remark-*.ts`
	  - `website-dev/src/features/docs/mdx/remark-*.ts`
	- Confidence: Medium.
	- Why: likely removable after import-path normalization and test updates.

## 6. CSS/style cleanup candidates

1. Suite scheme CSS files are near-template duplicates with only accent token changes.
	- Files:
	  - `website-dev/src/styles/schemes/default.css`
	  - `website-dev/src/styles/schemes/railyard.css`
	  - `website-dev/src/styles/schemes/registry.css`
	  - `website-dev/src/styles/schemes/template-mod.css`
	  - `website-dev/src/styles/schemes/website.css`
	  - `website-dev/src/styles/schemes/depot.css`
	- Recommendation: centralize common scheme template and keep only suite accent token maps.

2. Font stack does not follow the higher-polish convention intent.
	- File: `website-dev/src/styles/global.css`
	- Current default uses Inter/system stack; consider adopting a more intentional brand stack if design allows.

3. Global import scope includes heavy style bundles globally (`maplibre-gl/dist/maplibre-gl.css`).
	- File: `website-dev/src/styles/global.css`
	- Recommendation: consider route-level lazy style loading for map-specific surfaces.

4. Repeated hover/accent class strings in registry controls.
	- Files include `registry-sort-bar.tsx`, `registry-view-toggle.tsx`, `registry-type-toggle.tsx`, `registry-toolbar-dropdown.tsx`.
	- Recommendation: extract shared utility class builders or small style tokens in package/local style utility.

## 7. Naming and directory convention recommendations

1. Standardize page-entry naming.
	- Current mix: `page.tsx` and feature-named page files (`community-page.tsx`, `depot-page.tsx`, `railyard-page.tsx`, `registry-page.tsx`).
	- Recommendation: use `page.tsx` as entry and reserve suffixes for subcomponents only.

2. Standardize type file naming.
	- Current mix:
	  - `lib/types.ts`
	  - `feature-name-types.ts`
	  - `registry-search-types.ts`
	- Recommendation: prefer one convention (`types.ts` per folder, domain-specific names only when required).

3. Standardize topbar naming style.
	- Current mix: `navbar-topbar.tsx` (website-dev) vs `navbar-top-bar.tsx` (shared-ui).
	- Recommendation: choose one canonical style (`top-bar` or `topbar`) across repo.

4. Reduce barrel churn and dead exports.
	- Many `index.ts` files expose broad APIs with low observable in-package usage.
	- Recommendation: keep package barrels, minimize feature-local barrels unless actively needed.

## 8. Proposed PR breakdown in safe order

PR 1: Audit-safe cleanup (no behavior changes)
- Remove generated artifacts (`coverage`, `build/client`, stale `dist` outputs if confirmed generated).
- Remove clearly unused exports with direct no-usage proof.
- Normalize obvious naming inconsistencies where no public API break occurs.

PR 2: CSS/token consolidation
- Introduce shared suite scheme template + suite token maps.
- Keep visual output unchanged via snapshot/manual verification.

PR 3: Registry control consolidation
- Extract/merge registry search/sort/view/filter primitives.
- Prefer package placement in `asset-listings-ui` where reusable.

PR 4: Registry card convergence
- Choose one card engine direction (`website-dev` vs `asset-listings-ui`) and migrate progressively.
- Keep adapter compatibility during migration.

PR 5: MDX adapter consolidation
- Collapse pass-through wrappers.
- Move reusable adapter construction to `packages/mdx` extension points.

PR 6: Navigation model convergence
- Align `website-dev` navigation model with `packages/config` model (or define clear split and document it).

PR 7: Monolith splitting pass
- Split highest-risk large files first:
  - `website-dev/src/features/registry/detail/components/map-tab.tsx` (1005 lines)
  - `website-dev/src/shared/registry-card/registry-item-card.tsx` (795 lines)
  - `website-dev/src/features/registry/components/registry-filter-sidebar.tsx` (626 lines)
  - `website-dev/src/features/railyard/railyard-downloads.ts` (563 lines)
  - `website-dev/src/features/registry/detail/registry-detail-page.tsx` (507 lines)

PR 8: Root quality guardrails
- Adjust scripts and docs so CI/check behavior is deterministic and non-mutating.
- Ensure docs reflect actual available scripts.

## 9. Validation commands to run after each PR

From repo root:

```bash
pnpm run typecheck:packages
pnpm run test:packages
pnpm run test:coverage:packages
pnpm run check:website-dev
pnpm run check:website
```

For PRs touching only `website-dev` heavily, run additionally in `website-dev`:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test
pnpm run test:coverage
```

For PRs touching package APIs consumed by website apps, also run:

```bash
pnpm run check
```

## Additional observations (quality and risk)

- `website-dev/package.json` uses `ci` that applies mutations (`lint:fix`, `format`), which is unusual for CI reproducibility.
- Root `README.md` references `pnpm run ci`, but root `package.json` currently does not define `ci`.
- Content includes explicit development-site language in `website-dev/content/website/updates/v1.0.0.mdx` (mentions `dev.subwaybuildermodded.com`). Confirm if this remains intentional for production-facing copy.
- Static unused-export tools (`ts-prune`) produced many barrel-related false positives; use findings as triage only, not direct deletion list.
- Repo-level cleanup guidance has been updated in [AGENTS.md](AGENTS.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) to reflect the audit findings and the `website-dev` cleanup workflow.

## Validation baseline

Required cleanup gate:

```bash
cd website-dev
pnpm run ci
```

Other exact validation commands available in this workspace:

```bash
pnpm run check:packages
pnpm run test:packages
pnpm run test:coverage:packages
pnpm run check:website
pnpm run check:website-dev
pnpm run check:railyard
pnpm run check
```

Inside `website-dev`, the local validation commands are:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test
pnpm run test:coverage
pnpm run build
pnpm run dev
```

## Phase 1 completion status (2026-05-31)

Phase 1 objective: baseline and generated output hygiene with minimal blocker fixes.

What changed

- Confirmed and retained minimal type-safe fixes in:
	- `website-dev/src/features/markdown-playground/components/template-gallery-modal.test.tsx`
	- `website-dev/src/features/registry/detail/lib/normalize-registry-detail.ts`
- Kept `website-dev/src/features/registry/detail/registry-detail-page.tsx` in a clean diagnostic state after lint/format pass.

What was removed

- Removed generated artifacts and cached output directories:
	- `website-dev/coverage/`
	- `website-dev/public/community/`
	- `website-dev/public/railyard/`
	- `website-dev/public/registry/`
	- `website-dev/public/website/`

What was consolidated

- None in Phase 1 (intentionally deferred).

What moved into packages and why

- None in Phase 1 (intentionally deferred).

What stayed local to `website-dev` and why

- Feature behavior, route composition, and page orchestration remained local by design.
- Placeholder directories/files remained where needed (`build/client/.gitkeep`, `dist/.gitkeep`, and core static public assets).

Validation execution

- Ran required gate from inside `website-dev`: `pnpm run ci`.
- Result: PASS (`typecheck`, `lint:fix`, `format`, `test`, `test:coverage` all completed successfully).

Existing vs introduced failures

- Existing failures from prior baseline type blockers: RESOLVED.
- Introduced failures from Phase 1 changes: NONE.

Residual risks / follow-ups

- Non-fatal React warning still appears in tests about `preserveScroll` DOM prop; this did not fail CI and should be handled in a later focused cleanup PR.
- `website-dev` CI script still performs mutating steps (`lint:fix`, `format`), so subsequent runs may continue to modify files; keep this in mind for PR scoping.
