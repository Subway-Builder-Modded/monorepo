# website-dev src architecture

This folder is the application source root.

## Layout

- `shell/`: app composition and runtime boundaries (`SiteLayout`, `AppErrorBoundary`).
- `features/`: domain modules (`home`, `docs`) and their internal components/lib/mdx.
- `shared/`: cross-feature UI building blocks (navigation, footer).
- `config/`: site/docs/home metadata and configuration.
- `hooks/`: reusable hooks and navbar controller hooks.
- `lib/`: low-level utilities (router, `cn`).
- `styles/`: global CSS and scheme files.

## Import rules

- Prefer public barrels for top-level module usage:
  - `@/shell`
  - `@/features/home`
  - `@/features/docs`
- Deep imports are allowed inside a feature for feature-internal composition.
- Shared modules must not depend on feature modules.

## Stability rules

- Keep suite-owned content under `content/<suite>/*` and `tests` at project root unless a dedicated migration is planned.
- If you move source files, update:
  - `tsconfig.json` paths/includes
  - `vite.config.ts` aliases and MDX plugin paths
  - `vitest.config.ts` aliases/coverage/setup files
  - `components.json` aliases
