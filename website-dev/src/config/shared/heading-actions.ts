import type { LucideIcon } from "lucide-react";

export type HeadingActionConfig<TContext = void> = {
  label: string;
  href: string | ((context: TContext) => string | undefined | null);
  icon?: LucideIcon;
  external?: boolean;
};

export type HeadingActions<TContext = void> =
  | []
  | [HeadingActionConfig<TContext>]
  | [HeadingActionConfig<TContext>, HeadingActionConfig<TContext>]
  | [HeadingActionConfig<TContext>, HeadingActionConfig<TContext>, HeadingActionConfig<TContext>];

export type ResolvedHeadingActionConfig = {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
};

export function resolveHeadingActions<TContext>(
  actions: HeadingActions<TContext> | undefined,
  context: TContext,
): ResolvedHeadingActionConfig[] {
  if (!actions || actions.length === 0) {
    return [];
  }

  const resolved: ResolvedHeadingActionConfig[] = [];

  for (const action of actions) {
    const href = typeof action.href === "function" ? action.href(context) : action.href;
    if (typeof href !== "string" || !href.trim()) {
      continue;
    }

    resolved.push({
      label: action.label,
      href,
      icon: action.icon,
      external: action.external,
    });
  }

  return resolved;
}
