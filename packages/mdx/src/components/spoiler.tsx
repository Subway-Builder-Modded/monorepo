import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "../lib/cx.ts";
import type { IconResolver } from "./tabs.tsx";

export const SPOILER_DETAILS_CLASS =
  "group my-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_12px_28px_-22px_rgba(var(--elevation-shadow-rgb),0.45)]";

export const SPOILER_SUMMARY_CLASS =
  "group/summary flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-foreground outline-none hover:bg-muted/40 [&::-webkit-details-marker]:hidden";

const SPOILER_LABEL_CLASS =
  "text-foreground transition-colors group-hover/summary:text-[var(--suite-accent-light)] dark:group-hover/summary:text-[var(--suite-accent-dark)]";

export const SPOILER_BODY_CLASS =
  "border-t border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground/90 [&>:first-child]:mt-0 [&>:last-child]:mb-0";

function SpoilerSummaryLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-open:rotate-90"
        aria-hidden="true"
      />
      <span className="inline-flex items-center gap-2">
        {icon ? <span className={cx("shrink-0", SPOILER_LABEL_CLASS)}>{icon}</span> : null}
        <span className={SPOILER_LABEL_CLASS}>{children}</span>
      </span>
    </>
  );
}

type SpoilerProps = {
  title?: ReactNode;
  icon?: ReactNode | string;
  resolveIcon?: IconResolver;
  children?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function Spoiler({
  title = "Spoiler",
  icon,
  resolveIcon,
  children,
  defaultOpen = false,
  className,
}: SpoilerProps) {
  const resolvedIcon =
    typeof icon === "string" && resolveIcon
      ? (() => {
          const Icon = resolveIcon(icon);
          return <Icon className="size-4" aria-hidden={true} />;
        })()
      : typeof icon === "string"
        ? null
        : icon;

  return (
    <details className={cx(SPOILER_DETAILS_CLASS, className)} open={defaultOpen || undefined}>
      <summary className={SPOILER_SUMMARY_CLASS}>
        <SpoilerSummaryLabel icon={resolvedIcon}>{title}</SpoilerSummaryLabel>
      </summary>
      <div className={SPOILER_BODY_CLASS}>{children}</div>
    </details>
  );
}

export function MdxDetails({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <details className={cx(SPOILER_DETAILS_CLASS, className)} {...props}>
      {children}
    </details>
  );
}

export function MdxSummary({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <summary className={cx(SPOILER_SUMMARY_CLASS, className)} {...props}>
      <SpoilerSummaryLabel>{children}</SpoilerSummaryLabel>
    </summary>
  );
}
