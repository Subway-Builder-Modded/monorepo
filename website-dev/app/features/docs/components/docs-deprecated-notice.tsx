import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { getLatestVersion, type DocsSuiteId } from "@/app/config/docs";
import { getVersionSwitchUrl } from "@/app/features/docs/lib/routing";

type DocsDeprecatedNoticeProps = {
  suiteId: DocsSuiteId;
  version: string;
  currentSlug?: string | null;
  context?: "homepage" | "doc";
  className?: string;
};

export function DocsDeprecatedNotice({
  suiteId,
  version,
  currentSlug = null,
  context = "doc",
  className,
}: DocsDeprecatedNoticeProps) {
  const latestVersion = getLatestVersion(suiteId);
  const latestUrl =
    latestVersion && latestVersion !== version
      ? getVersionSwitchUrl(suiteId, latestVersion, currentSlug)
      : null;

  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          {context === "homepage" ? "You are viewing docs for" : "This page is from"}{" "}
          <strong>{version}</strong>, which is deprecated.
        </p>
        {context === "homepage" ? (
          <p className="mt-1 text-muted-foreground">
            Consider switching to the latest version for up-to-date information.
          </p>
        ) : null}

        {latestUrl ? (
          <Link
            to={latestUrl}
            className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-500/50 bg-transparent px-2 text-xs font-semibold text-amber-700 no-underline transition-colors hover:bg-amber-500/12 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-400/14 dark:hover:text-amber-200"
          >
            <ArrowUpRight className="size-3" aria-hidden="true" />
            View Latest Version
          </Link>
        ) : null}
      </div>
    </div>
  );
}
