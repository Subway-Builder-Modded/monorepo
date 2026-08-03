import type { CSSProperties } from "react";

// Shared Tailwind class constants for the registry feature.
//
// Tailwind v4 scans .ts sources, so these literal strings are safe to compose
// with cn(). The goal is to stop long accent/hover/surface blocks from being
// copy-pasted (and drifting) across browse and detail components.
//
// Accent-interactive constants read the generic vars --ui-accent-light /
// --ui-accent-dark. Call sites alias whichever accent applies, e.g.:
//   style={{ "--ui-accent-light": "var(--suite-accent-light)",
//            "--ui-accent-dark": "var(--suite-accent-dark)" }}
// Extend, don't fork: call sites append layout-only utilities (sizing, spans,
// gaps) — never new colors.

/** Hover treatment for accent-interactive surfaces (buttons, toggles). */
export const ACCENT_HOVER_SURFACE_CLASS =
  "hover:border-[color-mix(in_srgb,var(--ui-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--ui-accent-light)_10%,var(--background))] hover:text-[var(--ui-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--ui-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--ui-accent-dark)_10%,var(--background))] dark:hover:text-[var(--ui-accent-dark)]";

/** Square icon button base (pair with ACCENT_HOVER_SURFACE_CLASS + a size). */
export const ACCENT_ICON_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-border/30 bg-background text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Full-width toggle/selector row base (sidebar type buttons, visibility toggles). */
export const ACCENT_TOGGLE_BASE_CLASS =
  "group relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors";

/** Selected state of a toggle row. */
export const ACCENT_TOGGLE_ACTIVE_CLASS =
  "border-[color-mix(in_srgb,var(--ui-accent-light)_45%,var(--border))] bg-[color-mix(in_srgb,var(--ui-accent-light)_22%,var(--background))] text-[var(--ui-accent-light)] dark:border-[color-mix(in_srgb,var(--ui-accent-dark)_45%,var(--border))] dark:bg-[color-mix(in_srgb,var(--ui-accent-dark)_22%,var(--background))] dark:text-[var(--ui-accent-dark)]";

/** Idle toggle row that keeps its accent tint (asset-type selector rows). */
export const ACCENT_TOGGLE_IDLE_TINTED_CLASS =
  "border-[color-mix(in_srgb,var(--ui-accent-light)_25%,var(--border))] text-[color-mix(in_srgb,var(--ui-accent-light)_75%,var(--foreground))] hover:border-[color-mix(in_srgb,var(--ui-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--ui-accent-light)_12%,var(--background))] dark:border-[color-mix(in_srgb,var(--ui-accent-dark)_25%,var(--border))] dark:text-[color-mix(in_srgb,var(--ui-accent-dark)_75%,var(--foreground))] dark:hover:border-[color-mix(in_srgb,var(--ui-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--ui-accent-dark)_12%,var(--background))]";

/** Idle toggle row that stays neutral until hovered (visibility toggles). */
export const ACCENT_TOGGLE_IDLE_MUTED_CLASS =
  "border-border/30 text-muted-foreground hover:border-[color-mix(in_srgb,var(--ui-accent-light)_35%,var(--border))] hover:bg-[color-mix(in_srgb,var(--ui-accent-light)_12%,var(--background))] dark:hover:border-[color-mix(in_srgb,var(--ui-accent-dark)_35%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--ui-accent-dark)_12%,var(--background))]";

/** Uppercase micro-label above sidebar/filter sections. */
export const SECTION_LABEL_CLASS =
  "text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground";

/** Muted informational panel (e.g. the deprecation notice on detail pages). */
export const MUTED_PANEL_CLASS =
  "rounded-xl border border-border/50 bg-muted/20 text-muted-foreground";

/** Muted inert action chip/row (e.g. the Deprecated chip replacing Download). */
export const MUTED_ACTION_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/25 font-medium text-muted-foreground";

/** Inline style aliasing an accent var pair onto the generic --ui-accent vars. */
export function uiAccentStyle(lightVarOrColor: string, darkVarOrColor: string) {
  return {
    "--ui-accent-light": lightVarOrColor,
    "--ui-accent-dark": darkVarOrColor,
  } as CSSProperties;
}
