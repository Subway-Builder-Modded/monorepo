import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@subway-builder-modded/shared-ui";
import { ArrowDownToLine, Users } from "lucide-react";
import { getCountryFlagIcon } from "@/lib/country-flags";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { getRegistryTagBrowseUrl } from "@/features/registry/lib/routing";
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
const HTML_HEADING_START = "__SBM_HEADING_START__";
const HTML_HEADING_END = "__SBM_HEADING_END__";
const SYNTHETIC_COUNTRY_TAG_PREFIX = "country:";
const CARD_SURFACE_TRANSITION_CLASS =
  "transition-[background-color,box-shadow] duration-200 ease-out";
const TAG_SURFACE_TRANSITION_CLASS = "transition-[background-color] duration-200 ease-out";
// Gradient fade from card surface color to transparent - avoids mask opacity artifacts
const TAG_FADE_GRADIENT_STYLE = {
  background: "linear-gradient(to left, var(--card-surface), var(--card-surface) 40%, transparent)",
} as React.CSSProperties;

type DescriptionSegment = {
  text: string;
  bold?: boolean;
};

function stripHtml(input: string): string {
  if (typeof DOMParser === "undefined") {
    return input.replace(/<[^>]*>/g, " ");
  }
  const parsed = new DOMParser().parseFromString(input, "text/html");
  return parsed.body.textContent ?? "";
}

function stripHtmlWithDescriptionMarkers(input: string): string {
  const markedInput = input
    .replace(/<h[1-6]\b[^>]*>/gi, `\n${HTML_HEADING_START}`)
    .replace(/<\/h[1-6]>/gi, `${HTML_HEADING_END}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?(p|div|section|article|blockquote|li|ul|ol|pre|table|thead|tbody|tfoot|tr|td|th)\b[^>]*>/gi,
      "\n",
    );

  return stripHtml(markedInput);
}

function stripMarkdown(input: string): string {
  return input
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

function normalizeDescriptionLine(input: string): DescriptionSegment | null {
  const isHtmlHeading = input.includes(HTML_HEADING_START) || input.includes(HTML_HEADING_END);
  const withoutHtmlMarkers = input
    .replaceAll(HTML_HEADING_START, "")
    .replaceAll(HTML_HEADING_END, "");
  const headingMatch = withoutHtmlMarkers.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
  const isHeading = isHtmlHeading || Boolean(headingMatch);
  const lineContent = headingMatch ? headingMatch[2] : withoutHtmlMarkers;
  const normalized = stripMarkdown(lineContent).replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return {
    text: normalized,
    bold: isHeading,
  };
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getVisibleCardTags(tags: string[]) {
  return tags.filter((tag) => !tag.startsWith(SYNTHETIC_COUNTRY_TAG_PREFIX));
}

function normalizeDescriptionSegments(input: string): DescriptionSegment[] {
  const normalizedInput = /<[^>]+>/.test(input) ? stripHtmlWithDescriptionMarkers(input) : input;
  const lines = normalizedInput.split(/\r?\n+/);
  const segments: DescriptionSegment[] = [];

  for (const line of lines) {
    const normalized = normalizeDescriptionLine(line);
    if (!normalized) {
      continue;
    }
    segments.push(normalized);
  }

  return segments;
}

function truncateDescriptionSegments(
  segments: DescriptionSegment[],
  maxLength: number,
): DescriptionSegment[] {
  const result: DescriptionSegment[] = [];
  let usedLength = 0;

  for (const segment of segments) {
    const prefix = result.length > 0 ? " " : "";
    const available = maxLength - usedLength - prefix.length;

    if (available <= 0) {
      break;
    }

    if (segment.text.length <= available) {
      result.push({ ...segment, text: `${prefix}${segment.text}` });
      usedLength += prefix.length + segment.text.length;
      continue;
    }

    const truncatedText = truncate(segment.text, available);
    if (truncatedText) {
      result.push({ ...segment, text: `${prefix}${truncatedText}` });
    }
    break;
  }

  return result;
}

function useDescriptionPreview(description: string, maxLength: number): DescriptionSegment[] {
  return useMemo(() => {
    const normalizedSegments = normalizeDescriptionSegments(description);
    return truncateDescriptionSegments(normalizedSegments, maxLength);
  }, [description, maxLength]);
}

function useTagOverflowHint(ref: React.RefObject<HTMLDivElement | null>, dependencies: unknown[]) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      setIsOverflowing(false);
      return;
    }

    const measure = () => {
      const overflow = element.scrollWidth - element.clientWidth > 1;
      setIsOverflowing(overflow);
    };

    const frame = window.requestAnimationFrame(measure);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
          })
        : null;

    resizeObserver?.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref, ...dependencies]);

  return isOverflowing;
}

function DescriptionPreview({
  segments,
  className,
}: {
  segments: DescriptionSegment[];
  className: string;
}) {
  return (
    <p className={className}>
      {segments.map((segment, index) =>
        segment.bold ? (
          <strong key={`${index}-${segment.text}`} className="font-semibold">
            {segment.text}
          </strong>
        ) : (
          <Fragment key={`${index}-${segment.text}`}>{segment.text}</Fragment>
        ),
      )}
    </p>
  );
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
        background: `color-mix(in srgb, var(--registry-type-accent-light, ${typeConfig.accentLight}) 8%, transparent)`,
        border: `1px solid color-mix(in srgb, var(--registry-type-accent-light, ${typeConfig.accentLight}) 16%, transparent)`,
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

function AuthorLink({ author, authorId }: { author: string; authorId: string | null }) {
  if (!authorId) {
    return <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">{author}</p>;
  }

  return (
    <Link
      to={`/registry/authors/${encodeURIComponent(authorId)}`}
      onClick={(event) => event.stopPropagation()}
      className="pointer-events-auto inline-block w-fit max-w-full cursor-pointer truncate text-left text-xs leading-snug text-muted-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--suite-accent-light)] hover:decoration-[color-mix(in_srgb,var(--suite-accent-light)_60%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-[var(--suite-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--suite-accent-dark)_60%,transparent)]"
    >
      {author}
    </Link>
  );
}

function TitleLink({ title, href, className }: { title: string; href: string; className: string }) {
  return (
    <Link
      to={href}
      onClick={(event) => event.stopPropagation()}
      className={cn("pointer-events-auto inline-block w-fit max-w-full min-w-0", className)}
    >
      {title}
    </Link>
  );
}

function CardSurfaceLink({
  href,
  title,
  roundedClassName,
}: {
  href: string;
  title: string;
  roundedClassName: string;
}) {
  return (
    <Link
      to={href}
      aria-label={`Open ${title}`}
      className={cn(
        "absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        roundedClassName,
      )}
    >
      <span className="sr-only">Open {title}</span>
    </Link>
  );
}

type MapBadgesProps = {
  cityCode: string | null;
  countryCode: string | null;
  countryEmoji: string | null;
  population: number | null;
};

function MapBadges({ cityCode, countryCode, countryEmoji, population }: MapBadgesProps) {
  const normalizedCountryCode = countryCode?.toUpperCase() ?? null;
  const CountryFlagIcon = getCountryFlagIcon(normalizedCountryCode);
  const hasLocation = Boolean(cityCode || normalizedCountryCode || countryEmoji);
  if (!hasLocation && population === null) return null;

  return (
    <div className="flex max-w-[52%] items-center justify-end gap-2 text-xs text-muted-foreground">
      {hasLocation ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-border/30 bg-background px-2 py-0.5 font-medium uppercase">
          {cityCode ? <span className="truncate">{cityCode}</span> : null}
          {cityCode && (countryEmoji || normalizedCountryCode) ? (
            <span style={{ color: "color-mix(in srgb, currentColor 35%, transparent)" }}>|</span>
          ) : null}
          {CountryFlagIcon ? (
            <CountryFlagIcon
              aria-hidden={true}
              className="h-3.5 w-5 rounded-[2px] border border-border/50 object-cover"
            />
          ) : countryEmoji ? (
            <span aria-hidden={true}>{countryEmoji}</span>
          ) : null}
          {normalizedCountryCode ? <span className="truncate">{normalizedCountryCode}</span> : null}
        </span>
      ) : null}
      {population !== null ? (
        <span className="inline-flex items-center gap-1">
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

  useEffect(() => {
    setLoaded(false);
  }, [src]);

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
            "size-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]",
            hoverScale &&
              "transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-[1.06]",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
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
  const visibleTags = getVisibleCardTags(data.tags);
  const gridTagStripRef = useRef<HTMLDivElement>(null);
  const showTagOverflowHint = useTagOverflowHint(gridTagStripRef, [visibleTags.join("|")]);
  const typeAccentStyle = {
    "--card-type-accent-light": typeConfig.accentLight,
    "--card-type-accent-dark": typeConfig.accentDark,
  } as React.CSSProperties;

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden rounded-xl border border-border/30 [--card-surface:color-mix(in_srgb,var(--card)_97%,transparent)] bg-[var(--card-surface)] shadow-sm hover:border-border/45 hover:[--card-surface:color-mix(in_srgb,var(--card)_94%,black)] dark:[--card-surface:color-mix(in_srgb,var(--card)_98%,transparent)] dark:hover:[--card-surface:color-mix(in_srgb,var(--card)_97%,white)]",
        CARD_SURFACE_TRANSITION_CLASS,
        className,
      )}
      style={typeAccentStyle}
    >
      <CardSurfaceLink href={data.href} title={data.title} roundedClassName="rounded-xl" />
      <div className="relative z-20 flex h-full flex-col pointer-events-none">
        <div className="relative aspect-[2/1] w-full">
          <ThumbnailImage
            src={data.thumbnailSrc}
            containerClassName="absolute inset-0"
            hoverScale
          />
        </div>

        <div className="flex h-full flex-col gap-2 px-3 py-3 min-[1800px]:gap-2.5 min-[1800px]:px-4 min-[1800px]:py-4">
          <div className="flex items-center justify-between gap-2">
            <TypeBadge typeConfig={typeConfig} />
            <div className="flex items-center gap-3">
              {data.population !== null && <PopulationCount count={data.population} />}
              <DownloadCount count={data.totalDownloads} />
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 flex-1 items-center line-clamp-1 text-sm font-semibold leading-snug min-[1800px]:text-base">
                <TitleLink
                  title={data.title}
                  href={data.href}
                  className="truncate text-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
                />
              </h3>
              <MapBadges
                cityCode={data.cityCode}
                countryCode={data.countryCode}
                countryEmoji={data.countryEmoji}
                population={null}
              />
            </div>
            <AuthorLink author={data.author} authorId={data.authorId} />
          </div>

          <DescriptionPreview
            segments={previewText}
            className="h-8 overflow-hidden text-xs leading-4 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] min-[1800px]:h-10 min-[1800px]:text-sm min-[1800px]:leading-5"
          />

          {visibleTags.length > 0 ? (
            <div
              className={cn(
                "relative isolate h-5 overflow-hidden bg-[var(--card-surface)]",
                TAG_SURFACE_TRANSITION_CLASS,
              )}
            >
              <div ref={gridTagStripRef} className="flex flex-nowrap gap-1 pr-8">
                {visibleTags.map((tag) => (
                  <Link
                    key={tag}
                    to={getRegistryTagBrowseUrl(typeConfig.routeSegment, tag)}
                    preserveScroll={true}
                    onClick={(event) => event.stopPropagation()}
                    className="pointer-events-auto shrink-0 rounded-md border border-border/25 bg-muted/25 px-1.5 py-px text-xs text-muted-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              {showTagOverflowHint ? (
                <>
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-12",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                    style={TAG_FADE_GRADIENT_STYLE}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-5 bg-[var(--card-surface)]",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 inline-flex items-center bg-[var(--card-surface)] pl-1 text-xs tracking-wide text-muted-foreground",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                  >
                    ...
                  </span>
                </>
              ) : null}
            </div>
          ) : (
            <div className="h-5" aria-hidden={true} />
          )}
        </div>
      </div>
    </article>
  );
}

function RegistryCardFull({
  data,
  typeConfig,
  onMouseEnter,
  onMouseLeave,
  className,
}: Omit<RegistryItemCardProps, "variant">) {
  const previewText = useDescriptionPreview(data.description, FULL_DESC_MAX);
  const visibleTags = getVisibleCardTags(data.tags);
  const typeAccentStyle = {
    "--card-type-accent-light": typeConfig.accentLight,
    "--card-type-accent-dark": typeConfig.accentDark,
  } as React.CSSProperties;

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden rounded-xl border border-border/30 [--card-surface:color-mix(in_srgb,var(--card)_98%,transparent)] bg-[var(--card-surface)] shadow-sm hover:border-border/45 hover:[--card-surface:color-mix(in_srgb,var(--card)_95%,black)] dark:[--card-surface:color-mix(in_srgb,var(--card)_98%,transparent)] dark:hover:[--card-surface:color-mix(in_srgb,var(--card)_97%,white)]",
        CARD_SURFACE_TRANSITION_CLASS,
        className,
      )}
      style={typeAccentStyle}
    >
      <CardSurfaceLink href={data.href} title={data.title} roundedClassName="rounded-xl" />
      <div className="relative z-20 flex h-full flex-col pointer-events-none">
        <div className="relative aspect-[16/9] w-full">
          <ThumbnailImage
            src={data.thumbnailSrc}
            containerClassName="absolute inset-0"
            hoverScale
          />
        </div>

        <div className="flex h-full flex-col gap-3 px-4 py-4 min-[1800px]:gap-4 min-[1800px]:px-5 min-[1800px]:py-5">
          <div className="flex items-center justify-between gap-2">
            <TypeBadge typeConfig={typeConfig} size="md" />
            <div className="flex items-center gap-3">
              {data.population !== null && <PopulationCount count={data.population} />}
              <DownloadCount count={data.totalDownloads} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 flex-1 items-center line-clamp-1 text-base font-semibold leading-snug min-[1800px]:text-[1.12rem]">
                <TitleLink
                  title={data.title}
                  href={data.href}
                  className="truncate text-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
                />
              </h3>
              <MapBadges
                cityCode={data.cityCode}
                countryCode={data.countryCode}
                countryEmoji={data.countryEmoji}
                population={null}
              />
            </div>
            <AuthorLink author={data.author} authorId={data.authorId} />
          </div>

          <DescriptionPreview
            segments={previewText}
            className="line-clamp-4 min-h-[5.6rem] text-sm leading-relaxed text-muted-foreground min-[1800px]:text-base"
          />

          {visibleTags.length > 0 ? (
            <div className="overflow-hidden flex flex-wrap gap-1.5 content-start">
              {visibleTags.slice(0, 6).map((tag) => (
                <Link
                  key={tag}
                  to={getRegistryTagBrowseUrl(typeConfig.routeSegment, tag)}
                  preserveScroll={true}
                  onClick={(event) => event.stopPropagation()}
                  className="pointer-events-auto rounded-md border border-border/25 bg-muted/25 px-2 py-px text-xs text-muted-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ─── Full variant (kept for potential explicit use) ───────────────────────────
function RegistryCardList({ data, typeConfig, className }: Omit<RegistryItemCardProps, "variant">) {
  const previewText = useDescriptionPreview(data.description, 240);
  const visibleTags = getVisibleCardTags(data.tags);
  const listTagStripRef = useRef<HTMLDivElement>(null);
  const showTagOverflowHint = useTagOverflowHint(listTagStripRef, [visibleTags.join("|")]);
  const typeAccentStyle = {
    "--card-type-accent-light": typeConfig.accentLight,
    "--card-type-accent-dark": typeConfig.accentDark,
  } as React.CSSProperties;

  return (
    <article
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-border/30 [--card-surface:color-mix(in_srgb,var(--card)_97%,transparent)] bg-[var(--card-surface)] p-4 shadow-sm hover:border-border/45 hover:[--card-surface:color-mix(in_srgb,var(--card)_94%,black)] dark:[--card-surface:color-mix(in_srgb,var(--card)_98%,transparent)] dark:hover:[--card-surface:color-mix(in_srgb,var(--card)_97%,white)] min-[1800px]:p-5",
        CARD_SURFACE_TRANSITION_CLASS,
        className,
      )}
      style={typeAccentStyle}
    >
      <CardSurfaceLink href={data.href} title={data.title} roundedClassName="rounded-xl" />
      <div className="relative z-20 flex w-full min-w-0 items-start gap-5 pointer-events-none">
        <ThumbnailImage
          src={data.thumbnailSrc}
          containerClassName="relative self-stretch w-36 shrink-0 overflow-hidden rounded-lg sm:w-48 xl:w-56 min-[1800px]:w-64"
          hoverScale
          noImageLabel="N/A"
        />

        <div className="min-w-0 flex-1 overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <TypeBadge typeConfig={typeConfig} size="sm" />
              <div className="hidden items-center gap-3 sm:flex">
                {data.population !== null && <PopulationCount count={data.population} />}
                <DownloadCount count={data.totalDownloads} />
              </div>
            </div>
            <MapBadges
              cityCode={data.cityCode}
              countryCode={data.countryCode}
              countryEmoji={data.countryEmoji}
              population={null}
            />
          </div>

          <div className="space-y-0.5">
            <h3 className="flex min-w-0 items-center line-clamp-1 text-base font-semibold min-[1800px]:text-[1.12rem]">
              <TitleLink
                title={data.title}
                href={data.href}
                className="truncate text-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
              />
            </h3>
            <AuthorLink author={data.author} authorId={data.authorId} />
          </div>

          <DescriptionPreview
            segments={previewText}
            className="h-10 overflow-hidden text-sm leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] min-[1800px]:h-11 min-[1800px]:text-base"
          />

          {visibleTags.length > 0 ? (
            <div
              className={cn(
                "relative isolate h-5 overflow-hidden bg-[var(--card-surface)]",
                TAG_SURFACE_TRANSITION_CLASS,
              )}
            >
              <div ref={listTagStripRef} className="flex flex-nowrap gap-1 pr-8">
                {visibleTags.map((tag) => (
                  <Link
                    key={tag}
                    to={getRegistryTagBrowseUrl(typeConfig.routeSegment, tag)}
                    preserveScroll={true}
                    onClick={(event) => event.stopPropagation()}
                    className="pointer-events-auto shrink-0 rounded-md border border-border/25 bg-muted/25 px-1.5 py-px text-xs text-muted-foreground underline underline-offset-2 decoration-transparent transition-colors hover:text-[var(--card-type-accent-light)] hover:decoration-[color-mix(in_srgb,var(--card-type-accent-light)_62%,transparent)] dark:hover:text-[var(--card-type-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--card-type-accent-dark)_62%,transparent)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              {showTagOverflowHint ? (
                <>
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-12",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                    style={TAG_FADE_GRADIENT_STYLE}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-5 bg-[var(--card-surface)]",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 inline-flex items-center bg-[var(--card-surface)] pl-1 text-xs tracking-wide text-muted-foreground",
                      TAG_SURFACE_TRANSITION_CLASS,
                    )}
                  >
                    ...
                  </span>
                </>
              ) : null}
            </div>
          ) : (
            <div className="h-5" aria-hidden={true} />
          )}
        </div>
      </div>
    </article>
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
    case "full":
      return (
        <RegistryCardFull
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
