import * as icons from "lucide-react";
import type { ComponentType } from "react";

type IconProps = { className?: string; "aria-hidden"?: boolean };
export type LucideIconComponent = ComponentType<IconProps>;

const iconCache = new Map<string, LucideIconComponent>();

export function resolveLucideIcon(name: string): LucideIconComponent {
  const cached = iconCache.get(name);
  if (cached) {
    return cached;
  }

  const resolved = (icons as Record<string, unknown>)[name];
  if (
    resolved != null &&
    (typeof resolved === "function" ||
      (typeof resolved === "object" && "$$typeof" in (resolved as object)))
  ) {
    const component = resolved as LucideIconComponent;
    iconCache.set(name, component);
    return component;
  }

  throw new Error(`[content] Unknown icon name: "${name}"`);
}
