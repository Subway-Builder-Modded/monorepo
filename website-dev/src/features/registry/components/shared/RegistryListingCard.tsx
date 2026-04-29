import { useMemo } from "react";
import { Badge } from "@subway-builder-modded/shared-ui";
import { ArrowDownToLine, Map, Package, Users } from "lucide-react";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import type { RegistryItemBase } from "@/features/registry/lib/registry-types";

export type RegistryContentItem = RegistryItemBase;

type RegistryListingCardProps = {
  item: RegistryContentItem;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const DESCRIPTION_PREVIEW_MAX_LENGTH = 180;

function stripHtmlToText(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input.replace(/<[^>]*>/g, " ");
  }

  const parsed = new DOMParser().parseFromString(input, "text/html");
  return parsed.body.textContent ?? "";
}

function stripMarkdownSyntax(input: string): string {
  return input
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " ");
}

function normalizeDescriptionText(input: string): string {
  const withoutHtml = stripHtmlToText(input);
  const withoutMarkdown = stripMarkdownSyntax(withoutHtml);
  return withoutMarkdown.replace(/\s+/g, " ").trim();
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function RegistryListingCard({
  item,
  onMouseEnter,
  onMouseLeave,
  className,
}: RegistryListingCardProps) {
  const previewText = useMemo(() => {
    const normalized = normalizeDescriptionText(item.description);
    return truncateWithEllipsis(normalized, DESCRIPTION_PREVIEW_MAX_LENGTH);
  }, [item.description]);

  return (
    <Link
      to={item.href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "block w-[min(26rem,86vw)] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card/92 shadow-lg outline-none backdrop-blur-md transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl lg:w-[min(30rem,52vw)] xl:w-[min(34rem,46vw)] focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <article className="flex min-h-[27.5rem] flex-col">
        <div className="relative aspect-[16/8] w-full overflow-hidden bg-muted/30">
          {item.thumbnailSrc ? (
            <img
              src={item.thumbnailSrc}
              alt={`${item.title} preview`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
              Preview unavailable
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent" />
        </div>

        <div className="grid flex-1 grid-rows-[auto_auto_1fr] gap-3 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" size="sm" className="rounded-md px-2.5">
              {item.kind === "map" ? (
                <>
                  <Map className="size-3.5" aria-hidden={true} />
                  Map
                </>
              ) : (
                <>
                  <Package className="size-3.5" aria-hidden={true} />
                  Mod
                </>
              )}
            </Badge>

            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowDownToLine className="size-3.5" aria-hidden={true} />
              {numberFormatter.format(item.totalDownloads)}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5 self-start">
              <h3 className="line-clamp-1 text-base font-semibold leading-tight text-foreground">{item.title}</h3>
              <p className="line-clamp-1 text-xs font-medium text-foreground">{item.author}</p>
            </div>

            {item.kind === "map" && (item.cityCode || item.countryName || item.population !== null) ? (
              <div className="flex max-w-[52%] flex-wrap justify-end gap-2 text-xs text-muted-foreground">
                {item.cityCode ? (
                  <span className="rounded-md border border-border/60 bg-background/75 px-2 py-1 font-semibold text-foreground/85">
                    {item.cityCode}
                  </span>
                ) : null}
                {item.countryName ? (
                  <span className="rounded-md border border-border/60 bg-background/75 px-2 py-1">
                    {item.countryEmoji ? `${item.countryEmoji} ` : ""}
                    {item.countryName}
                  </span>
                ) : null}
                {item.population !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/75 px-2 py-1">
                    <Users className="size-3" aria-hidden={true} />
                    {numberFormatter.format(item.population)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{previewText}</p>
        </div>
      </article>
    </Link>
  );
}