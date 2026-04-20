import * as icons from "lucide-react";
import type { ComponentType } from "react";
import { FileQuestion } from "lucide-react";

type IconProps = { className?: string; "aria-hidden"?: boolean };
type LucideIcon = ComponentType<IconProps>;

const iconCache = new Map<string, LucideIcon>();

export function resolveIcon(name: string): LucideIcon {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  const resolved = (icons as Record<string, unknown>)[name];
  if (typeof resolved === "function") {
    iconCache.set(name, resolved as LucideIcon);
    return resolved as LucideIcon;
  }

  if (import.meta.env.DEV) {
    console.warn(`[docs] Unknown icon name: "${name}". Using fallback.`);
  }

  return FileQuestion;
}
