import { type ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  Bug,
  FlaskConical,
  Megaphone,
  Star,
} from "lucide-react";

type AdmonitionVariant =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "danger"
  | "info"
  | "success"
  | "deprecated"
  | "bug"
  | "example"
  | "announcement";

type AdmonitionConfig = {
  icon: typeof Info;
  label: string;
  borderClass: string;
  iconClass: string;
  bgClass: string;
  titleClass: string;
};

const VARIANT_CONFIG: Record<AdmonitionVariant, AdmonitionConfig> = {
  note: {
    icon: Info,
    label: "Note",
    borderClass: "border-l-blue-500/70 dark:border-l-blue-400/60",
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/5 dark:bg-blue-400/5",
    titleClass: "text-blue-700 dark:text-blue-300",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    borderClass: "border-l-emerald-500/70 dark:border-l-emerald-400/60",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/5 dark:bg-emerald-400/5",
    titleClass: "text-emerald-700 dark:text-emerald-300",
  },
  important: {
    icon: Star,
    label: "Important",
    borderClass: "border-l-violet-500/70 dark:border-l-violet-400/60",
    iconClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/5 dark:bg-violet-400/5",
    titleClass: "text-violet-700 dark:text-violet-300",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    borderClass: "border-l-amber-500/70 dark:border-l-amber-400/60",
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/5 dark:bg-amber-400/5",
    titleClass: "text-amber-700 dark:text-amber-300",
  },
  caution: {
    icon: AlertCircle,
    label: "Caution",
    borderClass: "border-l-orange-500/70 dark:border-l-orange-400/60",
    iconClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/5 dark:bg-orange-400/5",
    titleClass: "text-orange-700 dark:text-orange-300",
  },
  danger: {
    icon: Flame,
    label: "Danger",
    borderClass: "border-l-red-500/70 dark:border-l-red-400/60",
    iconClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/5 dark:bg-red-400/5",
    titleClass: "text-red-700 dark:text-red-300",
  },
  info: {
    icon: Info,
    label: "Info",
    borderClass: "border-l-sky-500/70 dark:border-l-sky-400/60",
    iconClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-500/5 dark:bg-sky-400/5",
    titleClass: "text-sky-700 dark:text-sky-300",
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    borderClass: "border-l-green-500/70 dark:border-l-green-400/60",
    iconClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/5 dark:bg-green-400/5",
    titleClass: "text-green-700 dark:text-green-300",
  },
  deprecated: {
    icon: Clock,
    label: "Deprecated",
    borderClass: "border-l-stone-500/70 dark:border-l-stone-400/60",
    iconClass: "text-stone-600 dark:text-stone-400",
    bgClass: "bg-stone-500/5 dark:bg-stone-400/5",
    titleClass: "text-stone-700 dark:text-stone-300",
  },
  bug: {
    icon: Bug,
    label: "Bug",
    borderClass: "border-l-rose-500/70 dark:border-l-rose-400/60",
    iconClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/5 dark:bg-rose-400/5",
    titleClass: "text-rose-700 dark:text-rose-300",
  },
  example: {
    icon: FlaskConical,
    label: "Example",
    borderClass: "border-l-indigo-500/70 dark:border-l-indigo-400/60",
    iconClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-500/5 dark:bg-indigo-400/5",
    titleClass: "text-indigo-700 dark:text-indigo-300",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    borderClass: "border-l-teal-500/70 dark:border-l-teal-400/60",
    iconClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/5 dark:bg-teal-400/5",
    titleClass: "text-teal-700 dark:text-teal-300",
  },
};

type AdmonitionProps = {
  variant: AdmonitionVariant;
  title?: string;
  children: ReactNode;
};

export function Admonition({ variant, title, children }: AdmonitionProps) {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.note;
  const Icon = config.icon;
  const displayTitle = title ?? config.label;

  return (
    <div
      role="note"
      aria-label={displayTitle}
      className={cn(
        "my-4 rounded-r-lg border-l-[3px] px-4 py-3",
        "transition-colors duration-150",
        config.borderClass,
        config.bgClass,
      )}
    >
      <div className={cn("mb-2 flex items-center gap-2 font-semibold text-sm", config.titleClass)}>
        <Icon className={cn("size-4 shrink-0", config.iconClass)} aria-hidden="true" />
        <span>{displayTitle}</span>
      </div>
      <div className="text-sm leading-relaxed text-foreground/85 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-2">
        {children}
      </div>
    </div>
  );
}

// Create named component wrappers for each variant for MDX registry
function makeAdmonitionComponent(variant: AdmonitionVariant) {
  function VariantAdmonition({ title, children }: { title?: string; children: ReactNode }) {
    return <Admonition variant={variant} title={title}>{children}</Admonition>;
  }
  VariantAdmonition.displayName = variant.charAt(0).toUpperCase() + variant.slice(1);
  return VariantAdmonition;
}

export const Note = makeAdmonitionComponent("note");
export const Tip = makeAdmonitionComponent("tip");
export const Important = makeAdmonitionComponent("important");
export const Warning = makeAdmonitionComponent("warning");
export const Caution = makeAdmonitionComponent("caution");
export const Danger = makeAdmonitionComponent("danger");
export const InfoAdmonition = makeAdmonitionComponent("info");
export const Success = makeAdmonitionComponent("success");
export const Deprecated = makeAdmonitionComponent("deprecated");
export const BugAdmonition = makeAdmonitionComponent("bug");
export const Example = makeAdmonitionComponent("example");
export const Announcement = makeAdmonitionComponent("announcement");
