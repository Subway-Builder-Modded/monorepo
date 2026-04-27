import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { Link } from "@/lib/router";

export const UTILITY_ACTION_CLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]";

export const UTILITY_ACTION_BUTTON_CLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground no-underline whitespace-nowrap cursor-pointer appearance-none border-0 bg-transparent text-left align-middle select-none transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)] focus-visible:outline-none";

type UtilityActionLinkProps = {
  href: string;
  label: string;
  icon?: LucideIcon;
  external?: boolean;
};

export function UtilityActionLink({ href, label, icon: Icon, external }: UtilityActionLinkProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={UTILITY_ACTION_CLASS}>
        {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
        <span>{label}</span>
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link to={href} className={UTILITY_ACTION_CLASS}>
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      <span>{label}</span>
    </Link>
  );
}
