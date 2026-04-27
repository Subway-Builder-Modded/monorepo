import * as lucide from "lucide-react";
import type { ComponentType } from "react";
import { DiscordIcon } from "./discord.ts";
import { GithubIcon } from "./github.ts";
import { KofiIcon } from "./kofi.ts";
import { MarkdownIcon } from "./markdown.ts";

export type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const CUSTOM_ICON_REGISTRY: Record<string, IconComponent> = {
  Discord: DiscordIcon,
  Github: GithubIcon,
  GitHub: GithubIcon,
  Kofi: KofiIcon,
  Markdown: MarkdownIcon,
};

/** Names of all custom (non-Lucide) icons accepted in content frontmatter. */
export const CUSTOM_ICON_NAMES: ReadonlySet<string> = new Set(Object.keys(CUSTOM_ICON_REGISTRY));

const iconCache = new Map<string, IconComponent>();

/**
 * Resolve an icon component by name. Checks custom icons first, then falls
 * through to lucide-react. Throws for unknown names.
 *
 * Usage mirrors lucide-react's named exports — swap in this resolver anywhere
 * you need to look up an icon by string.
 */
export function resolveIcon(name: string): IconComponent {
  const cached = iconCache.get(name);
  if (cached) return cached;

  const custom = CUSTOM_ICON_REGISTRY[name];
  if (custom) {
    iconCache.set(name, custom);
    return custom;
  }

  const resolved = (lucide as Record<string, unknown>)[name];
  if (
    resolved != null &&
    (typeof resolved === "function" ||
      (typeof resolved === "object" && "$$typeof" in (resolved as object)))
  ) {
    const component = resolved as IconComponent;
    iconCache.set(name, component);
    return component;
  }

  throw new Error(`[icons] Unknown icon name: "${name}"`);
}
