# Website-Dev Redesign Phase 1 Technical Notes

## 1. Scope and Constraints Applied

This phase intentionally focused on foundation-level design-system and shell behavior work, not a full app port.

Implemented scope:

- Accurate old-site token/theme migration for light and dark mode.
- Shared suite/navigation configuration for the five required suites.
- Floating navbar with compact and expanded states, attached panel, overlay, and suite switching.
- Production-style footer built from shared suite data.
- Real pages for:
  - `/`
  - `/railyard`
  - `/registry`
  - `/template-mod`
  - `/website`
- A polished homepage to stress-test hierarchy, visual language, and interaction quality.

Explicitly excluded:

- Tools suite navigation and tools routing.
- Full legacy website port.
- Large scaffold trees for future pages.

## 2. High-Level Architecture

The implementation is split into two layers:

1. Shared data layer in packages/config

- File: `packages/config/src/website-dev/suites.ts`
- Purpose: single source of truth for suite IDs, display metadata, accents, route matching rules, nav items, and community links.
- Why: avoids duplicated suite metadata across navbar, footer, and route logic.

2. Website-dev app layer

- Purpose: route-aware shell composition and visual components (navbar, footer, pages).
- Pattern: shared config in, UI out.
- Why: keeps page components lightweight and declarative while navigation logic stays centralized.

## 3. Theme and Token Port (How It Was Done)

### 3.1 Token port strategy

The old site values were ported as CSS variables, not approximated. Base tokens and suite schemes were copied into website-dev CSS under:

- `app/styles/globals.css`
- `app/styles/schemes/default.css`
- `app/styles/schemes/railyard.css`
- `app/styles/schemes/registry.css`
- `app/styles/schemes/template-mod.css`
- `app/styles/schemes/website.css`

### 3.2 Token categories included

At minimum, these were migrated and wired through Tailwind theme aliases:

- Core surfaces: background, foreground, card, popover, surface-raised, surface-sunken.
- Semantic controls: primary, secondary, muted, accent, destructive.
- Structural tokens: border, input, ring.
- Sidebar/navbar-adjacent tokens: sidebar, sidebar-accent, sidebar-border, sidebar-ring, navbar.
- Radius scale and font tokens.
- Suite accent/link/text variants for light/dark.

### 3.3 Why this approach

- Variable-based theming allows suite switching and theme switching without hardcoded component colors.
- Preserves visual fidelity to old-site color behavior while modernizing shell composition.
- Keeps components mostly token-driven and easier to maintain.

## 4. Shared Suite Model (How and Why)

### 4.1 Shared types and constants

In `packages/config/src/website-dev/suites.ts` the following were defined:

- `WebsiteDevSuiteId`
- `WebsiteDevSuiteConfig`
- `WebsiteDevSuiteNavItem`
- `WebsiteDevRouteMatchRule`
- `WEBSITE_DEV_SUITES`
- `WEBSITE_DEV_COMMUNITY_LINKS`

Each suite includes:

- Stable ID
- Title and root href
- Icon key
- Color scheme ID
- Explicit light/dark accent definitions
- Line marker metadata (line number/label)
- Route items with breadcrumb and match rules

### 4.2 Route resolution helpers

Helpers were added for deterministic route-to-suite resolution:

- `resolveWebsiteDevSuite(pathname)`
- `resolveWebsiteDevSuiteItem(pathname, suiteId?)`
- `isWebsiteDevRouteMatch(pathname, rule)`

Why:

- Navbar, page shell, and footer can consume the same route truth.
- Breadcrumb selection remains predictable as nested paths grow.

## 5. React Router Removal and Routing Replacement

## 5.1 Why React Router was removed

The app still had framework leftovers from the scaffold. To satisfy the requirement for no React Router usage, website-dev was converted to a pure Vite SPA entry.

### 5.2 What was removed

- Scripts and dependencies tied to React Router in `website-dev/package.json`.
- Router plugin usage in `website-dev/vite.config.ts`.
- Router-generated type references in `website-dev/tsconfig.json`.
- Framework-specific files:
  - `app/root.tsx`
  - `app/routes.ts`
  - `app/entry.server.tsx`
  - `react-router.config.ts`

### 5.3 What replaced it

New Vite SPA startup:

- `index.html`
- `app/main.tsx`
- `app/app.tsx`

Minimal internal router utility:

- `app/lib/router.tsx`

This router utility provides:

- `useLocation()` via `useSyncExternalStore` (subscribes to `popstate` and a custom navigation event)
- `navigate(to)` for programmatic navigation
- `useNavigate()` convenience hook
- `Link` component that intercepts internal left-click navigation and falls back correctly for modified clicks and external targets

### 5.4 Route mapping behavior

`app/app.tsx` maps pathname prefixes to page modules:

- `/railyard` -> railyard page
- `/registry` -> registry page
- `/template-mod` -> template-mod page
- `/website` -> website page
- all other paths -> home page

Why this was chosen:

- Very small surface area.
- Easy to reason about.
- No client-router dependency overhead.
- Meets current route scope exactly.

## 6. Shell Composition

Shell component:

- `app/components/shell/site-shell.tsx`

Responsibilities:

- Resolve active suite from current pathname.
- Set `data-color-scheme` for suite-level token application.
- Render floating navbar, page content slot, and footer.
- Apply subtle suite-aware radial atmosphere background.

Why:

- Keeps every route page consistent.
- Centralizes suite context for visual theming.

## 7. Floating Navbar Details

Primary file:

- `app/components/navigation/floating-navbar.tsx`

### 7.1 State model

- `isOpen`: controls expanded/collapsed rendering
- `isPinned`: controls whether hover-leave can close
- `selectedSuiteId`: controls panel suite focus and accent variables

### 7.2 Open/close interaction model

- Desktop hover enters: open.
- Desktop hover leaves: close only if not pinned.
- Click pill:
  - opens + pins when closed
  - pins if already open
- Overlay click: close and unpin.
- Escape key: close and unpin.
- Mobile tap: open and pin (no hover dependency).

### 7.3 Expanded header contents

- Suite icon and title
- Suite select dropdown
- Breadcrumb segment display
- Theme switch button (cycles light/dark/system)
- Close button

### 7.4 Panel contents

- Suite item cards rendered from shared suite data.
- Cards use signage-inspired structure (large line marker + title/description hierarchy).
- Active item exposes `aria-current="page"`.

### 7.5 Motion and performance choices

- Motion usage limited to overlay and expand/panel transition.
- Transform/opacity transitions only.
- Duration set to zero when reduced motion is requested.
- Derived suite data via memoization where appropriate.

## 8. Theme Switcher and Initialization

Primary file:

- `app/hooks/use-theme-mode.ts`

Behavior:

- Stores mode in localStorage key: `sbm-website-dev-theme`.
- Supports `light`, `dark`, and `system`.
- Applies `.dark` class and `data-theme` attribute on `documentElement`.
- Watches system preference only while mode is `system`.

Initialization:

- `initializeThemeFromStorage()` is called in `app/main.tsx` before render.
- Why: avoid a visual flash between default and persisted theme.

## 9. Footer Details

Primary file:

- `app/components/footer/site-footer.tsx`

Design and data flow:

- Footer is fully data-driven from `WEBSITE_DEV_SUITES` and `WEBSITE_DEV_COMMUNITY_LINKS`.
- Renders suite columns and per-suite links.
- Uses suite accent lines and badges for transit-line visual continuity.
- Includes community actions (GitHub/Discord) as external links.

Why:

- Keeps footer consistent with navigation model.
- New suites/pages can be added by updating shared data once.

## 10. Page Implementation

Home page:

- `app/components/pages/home-design-page.tsx`
- Purpose: polished style validation page (hero, suite cards, signage panel study, staged reveal motion)

Suite pages:

- `app/components/pages/suite-overview-page.tsx`
- Routes:
  - `app/routes/railyard.tsx`
  - `app/routes/registry.tsx`
  - `app/routes/template-mod.tsx`
  - `app/routes/website.tsx`

Why:

- Homepage stress-tests the new visual language.
- Suite pages remain intentional and production-like without over-scaffolding.

## 11. Accessibility and UX Considerations

Implemented behaviors include:

- Keyboard Escape to close navbar modal state.
- Close and theme controls have explicit `aria-label` values.
- Active route indication via `aria-current` on active panel links.
- Focus-visible rings retained through tokenized ring styling.
- Overlay presented as an actionable close control.

## 12. Validation and Quality Checks

After implementation and React Router removal, these commands were executed:

- `pnpm --dir website-dev run check`
- `pnpm --dir website-dev run build`
- `pnpm run check:packages`

Result:

- All checks passed.
- Website-dev build succeeds as a pure Vite SPA.

## 13. Final State Summary

Phase 1 now provides:

- Accurate old-site token fidelity in website-dev.
- Shared suite model used by navbar, footer, and route logic.
- Floating premium navbar with pinned/hover/modal behavior.
- Production-style footer aligned with suite accents.
- Real pages for the five required routes.
- No React Router usage in website-dev source/build pipeline.
