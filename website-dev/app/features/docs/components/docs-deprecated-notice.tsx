import { AlertTriangle } from "lucide-react";
import { cn } from "@/app/lib/utils";

type DocsDeprecatedNoticeProps = {
  version: string;
  context?: "homepage" | "doc";
  className?: string;
};

export function DocsDeprecatedNotice({
  version,
  context = "doc",
  className,
}: DocsDeprecatedNoticeProps) {
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
      </div>
    </div>
  );
}
