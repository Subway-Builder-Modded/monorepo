import * as icons from "lucide-react";
import type { ComponentType } from "react";

type IconProps = { className?: string; "aria-hidden"?: boolean };
type LucideIcon = ComponentType<IconProps>;

const iconCache = new Map<string, LucideIcon>();

export function resolveIcon(name: string): LucideIcon {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  const resolved = (icons as Record<string, unknown>)[name];
  if (
    resolved != null &&
    (typeof resolved === "function" ||
      (typeof resolved === "object" && "$$typeof" in (resolved as object)))
  ) {
    iconCache.set(name, resolved as LucideIcon);
    return resolved as LucideIcon;
  }

  throw new Error(`[docs] Unknown icon name: "${name}"`);
}
