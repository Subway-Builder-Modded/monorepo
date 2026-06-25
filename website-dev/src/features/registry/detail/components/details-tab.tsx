import {
  DirectoryCard,
  SectionSeparator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp, ExternalLink, type LucideIcon } from "lucide-react";
import { Link } from "@/lib/router";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { getDetailsTabSections } from "@/features/registry/detail/config/details-tab-config";

type DetailsTabProps = {
  detail: RegistryDetailModel;
};

export type DetailMetric = {
  title: string;
  titleAccessory?: ReactNode;
  titleTooltipContent?: ReactNode;
  titleTooltipAriaLabel?: string;
  value: string | ReactNode;
  icon: LucideIcon;
  link?: string;
};

type DetailMetricCardProps = {
  title: string;
  titleAccessory?: ReactNode;
  titleTooltipContent?: ReactNode;
  titleTooltipAriaLabel?: string;
  value: string | ReactNode;
  icon: LucideIcon;
  link?: string;
  accentLight: string;
  accentDark: string;
  alignToWrappedRow: boolean;
  titleWraps: boolean;
};

function DetailMetricCard({
  title,
  titleAccessory,
  titleTooltipContent,
  titleTooltipAriaLabel,
  value,
  icon: Icon,
  link,
  accentLight,
  accentDark,
  alignToWrappedRow,
  titleWraps,
}: DetailMetricCardProps) {
  const isLinked = typeof link === "string" && link.length > 0;

  return (
    <div data-metric-card={true} className="h-full">
      <DirectoryCard
        asChild={isLinked}
        alignment="top"
        interactive={isLinked}
        showChevron={false}
        accentLight={accentLight}
        accentDark={accentDark}
        icon={<Icon className="size-3.5 translate-y-[0.08rem]" aria-hidden={true} />}
        iconClassName={`!mt-[0.28rem] flex h-4 items-center opacity-100 ${
          isLinked
            ? "text-muted-foreground dark:text-muted-foreground transition-colors group-hover:!text-[var(--registry-type-accent)]"
            : "text-muted-foreground dark:text-muted-foreground"
        }`}
        heading={
          <div className="flex h-full flex-col py-0.5">
            <p
              className={`min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground ${
                isLinked
                  ? "transition-colors duration-150 ease-out group-hover:text-[var(--registry-type-accent)]"
                  : ""
              }`}
            >
              <span
                className={`relative flex min-h-4 w-full items-center gap-1 align-middle ${
                  titleAccessory ? "pr-11" : ""
                }`}
              >
                <span data-metric-title={true} className="inline-flex min-w-0 items-center gap-1">
                  <span className="min-w-0">{title}</span>
                  {titleTooltipContent ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-4 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none"
                            aria-label={titleTooltipAriaLabel ?? `About ${title}`}
                          >
                            <CircleHelp className="size-3 text-current" aria-hidden={true} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-60" side="top">
                          {titleTooltipContent}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                  {isLinked ? (
                    <ExternalLink className="size-3 text-current" aria-hidden={true} />
                  ) : null}
                </span>
                {titleAccessory ? (
                  <span className="absolute right-0 top-1/2 inline-flex shrink-0 -translate-y-1/2 items-center">
                    {titleAccessory}
                  </span>
                ) : null}
              </span>
            </p>
            <p
              className={`mt-auto text-xl font-semibold leading-tight tracking-tight text-foreground ${alignToWrappedRow && !titleWraps ? "pt-6" : "pt-2"} ${
                isLinked
                  ? "transition-colors duration-150 ease-out group-hover:text-[var(--registry-type-accent)]"
                  : ""
              }`}
            >
              {value}
            </p>
          </div>
        }
        className={`h-full rounded-2xl border border-border/70 bg-card/75 p-2 ${
          isLinked
            ? "!transition-colors duration-150 ease-out hover:!border-[color-mix(in_srgb,var(--registry-type-accent)_52%,transparent)] hover:!bg-[color-mix(in_srgb,var(--registry-type-accent)_16%,transparent)]"
            : ""
        }`}
      >
        {isLinked ? <Link to={link!}>{null}</Link> : undefined}
      </DirectoryCard>
    </div>
  );
}

export function DetailsMetricGrid({
  items,
  className,
  accentLight,
  accentDark,
}: {
  items: DetailMetric[];
  className: string;
  accentLight: string;
  accentDark: string;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [alignToWrappedRow, setAlignToWrappedRow] = useState<boolean[]>(() =>
    Array.from({ length: items.length }, () => false),
  );
  const [titleWraps, setTitleWraps] = useState<boolean[]>(() =>
    Array.from({ length: items.length }, () => false),
  );

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    const recompute = () => {
      const cardElements = Array.from(grid.querySelectorAll<HTMLElement>("[data-metric-card]"));
      if (cardElements.length === 0) {
        setAlignToWrappedRow([]);
        setTitleWraps([]);
        return;
      }

      const rowGroups = new Map<number, Array<{ index: number; wraps: boolean }>>();

      cardElements.forEach((cardElement, index) => {
        const top = Math.round(cardElement.offsetTop);
        const title = cardElement.querySelector<HTMLElement>("[data-metric-title]");
        const lineHeight = title ? Number.parseFloat(getComputedStyle(title).lineHeight || "0") : 0;
        const titleHeight = title ? title.getBoundingClientRect().height : 0;
        const wraps = lineHeight > 0 ? titleHeight > lineHeight * 1.35 : false;

        const group = rowGroups.get(top);
        if (group) {
          group.push({ index, wraps });
        } else {
          rowGroups.set(top, [{ index, wraps }]);
        }
      });

      const nextAlign = Array.from({ length: cardElements.length }, () => false);
      const nextWraps = Array.from({ length: cardElements.length }, () => false);

      rowGroups.forEach((row) => {
        const rowHasWrap = row.some((entry) => entry.wraps);
        row.forEach((entry) => {
          nextWraps[entry.index] = entry.wraps;
          nextAlign[entry.index] = rowHasWrap;
        });
      });

      setAlignToWrappedRow((prev) => {
        if (
          prev.length === nextAlign.length &&
          prev.every((value, index) => value === nextAlign[index])
        ) {
          return prev;
        }
        return nextAlign;
      });

      setTitleWraps((prev) => {
        if (
          prev.length === nextWraps.length &&
          prev.every((value, index) => value === nextWraps[index])
        ) {
          return prev;
        }
        return nextWraps;
      });
    };

    const runRecompute = () => {
      requestAnimationFrame(recompute);
    };

    runRecompute();

    const observer = new ResizeObserver(runRecompute);
    observer.observe(grid);
    Array.from(grid.querySelectorAll<HTMLElement>("[data-metric-title]")).forEach((title) => {
      observer.observe(title);
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  return (
    <div ref={gridRef} className={className}>
      {items.map((item, index) => (
        <DetailMetricCard
          key={`${item.title}-${index}`}
          title={item.title}
          titleAccessory={item.titleAccessory}
          titleTooltipContent={item.titleTooltipContent}
          titleTooltipAriaLabel={item.titleTooltipAriaLabel}
          value={item.value}
          icon={item.icon}
          link={item.link}
          accentLight={accentLight}
          accentDark={accentDark}
          alignToWrappedRow={alignToWrappedRow[index] ?? false}
          titleWraps={titleWraps[index] ?? false}
        />
      ))}
    </div>
  );
}

export function DetailsTab({ detail }: DetailsTabProps) {
  const sections = getDetailsTabSections(detail);

  return (
    <section className="space-y-3">
      {sections.map((section, index) => (
        <div key={`${section.title}-${index}`}>
          <SectionSeparator
            label={section.title}
            icon={section.icon}
            className={index === 0 ? "mb-4" : "mb-4 mt-7"}
          />
          <DetailsMetricGrid
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            items={section.cards}
            accentLight={detail.typeConfig.accentLight}
            accentDark={detail.typeConfig.accentDark}
          />
        </div>
      ))}
    </section>
  );
}
