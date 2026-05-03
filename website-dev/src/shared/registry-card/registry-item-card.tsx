import { useMemo, useState } from "react";
import { Badge } from "@subway-builder-modded/shared-ui";
import { ArrowDownToLine, Users } from "lucide-react";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import type {
  RegistryCardData,
  RegistryCardVariant,
  RegistryTypeConfig,
} from "./registry-item-types";

export type { RegistryCardData, RegistryCardVariant, RegistryTypeConfig };

type RegistryItemCardProps = {
  data: RegistryCardData;
  typeConfig: RegistryTypeConfig;
  variant?: RegistryCardVariant;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const FULL_DESC_MAX = 260;

function stripHtml(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input.replace(/<[^>]*>/g, " ");
  }
  const parsed = new DOMParser().parseFromString(input, "text/html");
  return parsed.body.textContent ?? "";
}

function stripMarkdown(input: string): string {
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

function normalizeDescription(input: string): string {
  return stripMarkdown(stripHtml(input)).replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function useDescriptionPreview(description: string, maxLength: number): string {
  return useMemo(() => {
    const normalized = normalizeDescription(description);
    return truncate(normalized, maxLength);
  }, [description, maxLength]);
}

type TypeBadgeProps = {
  typeConfig: RegistryTypeConfig;
  size?: "sm" | "md";
};

function TypeBadge({ typeConfig, size = "sm" }: TypeBadgeProps) {
  return (
    <Badge
      variant="secondary"
      size={size}
      className="rounded-md px-2.5 font-semibold"
      style={{
        color: `var(--registry-type-accent-light, ${typeConfig.accentLight})`,
        background: `color-mix(in srgb, var(--registry-type-accent-light, ${typeConfig.accentLight}) 12%, transparent)`,
        border: `1px solid color-mix(in srgb, var(--registry-type-accent-light, ${typeConfig.accentLight}) 28%, transparent)`,
      }}
    >
      {typeConfig.label}
    </Badge>
  );
}

type DownloadCountProps = {
  count: number;
};

function DownloadCount({ count }: DownloadCountProps) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <ArrowDownToLine className="size-3.5" aria-hidden={true} />
      {numberFormatter.format(count)}
    </div>
  );
}

function PopulationCount({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Users className="size-3.5" aria-hidden={true} />
      {numberFormatter.format(count)}
    </div>
  );
}

type MapBadgesProps = {
  cityCode: string | null;
  countryName: string | null;
  countryEmoji: string | null;
  population: number | null;
};

function MapBadges({ cityCode, countryName, countryEmoji, population }: MapBadgesProps) {
  if (!cityCode && !countryName && population === null) return null;

  return (
    <div className="flex max-w-[52%] flex-wrap justify-end gap-2 text-xs text-muted-foreground">
      {cityCode ? (
        <span className="rounded-md border border-border/60 bg-background/75 px-2 py-1 font-semibold text-foreground/85">
          {cityCode}
        </span>
      ) : null}
      {countryName ? (
        <span className="rounded-md border border-border/60 bg-background/75 px-2 py-1">
          {countryEmoji ? `${countryEmoji} ` : ""}
          {countryName}
        </span>
      ) : null}
      {population !== null ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/75 px-2 py-1">
          <Users className="size-3" aria-hidden={true} />
          {numberFormatter.format(population)}
        </span>
      ) : null}
    </div>
  );
}

// ─── Thumbnail with skeleton pulse ───────────────────────────────────────────
type ThumbnailImageProps = {
  src: string | null | undefined;
  className?: string;
  containerClassName?: string;
  hoverScale?: boolean;
  noImageLabel?: string;
};

function ThumbnailImage({
  src,
  className,
  containerClassName,
  hoverScale = false,
  noImageLabel = "Preview unavailable",
}: ThumbnailImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30",
        !loaded && src ? "animate-pulse" : undefined,
        containerClassName,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={cn(
            "size-full object-cover transition-opacity duration-300",
            hoverScale && "transition-transform duration-500 group-hover:scale-[1.02]",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          loading="eager"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {noImageLabel}
        </div>
      )}
    </div>
  );
}

// ─── Grid / Carousel variant ─────────────────────────────────────────────────
function RegistryCardGrid({
  data,
  typeConfig,
  onMouseEnter,
  onMouseLeave,
  className,
}: Omit<RegistryItemCardProps, "variant">) {
  const previewText = useDescriptionPreview(data.description, FULL_DESC_MAX);

  return (
    <Link
      to={data.href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border/50 bg-card/92 shadow-sm outline-none transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <article>
        <div className="relative aspect-[2/1] w-full">
          <ThumbnailImage
            src={data.thumbnailSrc}
            containerClassName="absolute inset-0"
            hoverScale
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card/90 to-transparent" />
        </div>

        <div className="space-y-2 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <TypeBadge typeConfig={typeConfig} />
            <div className="flex items-center gap-3">
              {data.population !== null && <PopulationCount count={data.population} />}
              <DownloadCount count={data.totalDownloads} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
                {data.title}
              </h3>
              <p className="text-xs text-muted-foreground">{data.author}</p>
            </div>
            <MapBadges
              cityCode={data.cityCode}
              countryName={data.countryName}
              countryEmoji={data.countryEmoji}
              population={null}
            />
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {previewText}
          </p>

          {data.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/50 bg-muted/40 px-1.5 py-px text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

// ─── Full variant (kept for potential explicit use) ───────────────────────────
function RegistryCardList({ data, typeConfig, className }: Omit<RegistryItemCardProps, "variant">) {
  const previewText = useDescriptionPreview(data.description, 160);

  return (
    <Link
      to={data.href}
      className={cn(
        "group flex gap-4 overflow-hidden rounded-xl border border-border/50 bg-card/92 p-3 shadow-sm outline-none backdrop-blur-sm transition-[background,box-shadow] duration-200 hover:bg-card hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <article className="flex w-full min-w-0 items-start gap-4">
        <ThumbnailImage
          src={data.thumbnailSrc}
          containerClassName="relative aspect-[4/3] w-24 shrink-0 rounded-lg sm:w-32"
          noImageLabel="N/A"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge typeConfig={typeConfig} size="sm" />
            {data.cityCode ? (
              <span className="rounded-md border border-border/60 bg-background/75 px-2 py-0.5 text-xs font-semibold text-foreground/85">
                {data.cityCode}
              </span>
            ) : null}
            {data.countryName ? (
              <span className="text-xs text-muted-foreground">
                {data.countryEmoji ? `${data.countryEmoji} ` : ""}
                {data.countryName}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{data.title}</h3>
            <p className="text-xs text-muted-foreground">{data.author}</p>
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:line-clamp-1">
            {previewText}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {data.population !== null && <PopulationCount count={data.population} />}
          <DownloadCount count={data.totalDownloads} />
        </div>
      </article>
    </Link>
  );
}

export function RegistryItemCard({
  data,
  typeConfig,
  variant = "grid",
  onMouseEnter,
  onMouseLeave,
  className,
}: RegistryItemCardProps) {
  switch (variant) {
    case "list":
      return (
        <RegistryCardList
          data={data}
          typeConfig={typeConfig}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={className}
        />
      );
    case "grid":
    default:
      return (
        <RegistryCardGrid
          data={data}
          typeConfig={typeConfig}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={className}
        />
      );
  }
}
