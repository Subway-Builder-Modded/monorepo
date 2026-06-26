import {
  BadgeCheck,
  CalendarDays,
  CircleHelp,
  Code2,
  UserStar,
  ExternalLink,
  FolderGit2,
  Layers,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import {
  Fragment,
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getSuiteById } from "@/config/site-navigation";
import { Link } from "@/lib/router";
import { getRegistryTagBrowseUrl } from "@/features/registry/lib/routing";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { AuthorRoleBadge } from "@/features/registry/components/author-role-badge";
import {
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { getRegistryTypeUiRules } from "@/features/registry/registry-type-ui";

type RegistryDetailSidebarProps = {
  detail: RegistryDetailModel;
  accentColor: string;
  onOpenImage: (index: number) => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-base text-foreground">
      <dt className="inline-flex items-center gap-2">
        <span className="text-foreground">{icon}</span>
        <span>{label}</span>
      </dt>
      <dd className="font-medium text-muted-foreground">{value}</dd>
    </div>
  );
}

function DemandDataRow({
  icon,
  label,
  value,
  tooltipContent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tooltipContent: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-base text-foreground">
      <dt className="inline-flex items-center gap-2">
        <span className="text-foreground">{icon}</span>
        <span>{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none"
                aria-label={`About ${label}`}
              >
                <CircleHelp className="size-3.5" aria-hidden={true} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-60" side="top">
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </dt>
      <dd className="font-medium text-muted-foreground">{value}</dd>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "—";
  }

  return dateFormatter.format(new Date(parsed));
}

function FadedSectionSeparator() {
  return (
    <div
      aria-hidden={true}
      className="h-px w-full bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--border)_70%,transparent)_20%,color-mix(in_srgb,var(--border)_70%,transparent)_80%,transparent_100%)]"
    />
  );
}

export function RegistryDetailSidebar({
  detail,
  accentColor,
  onOpenImage: _onOpenImage,
}: RegistryDetailSidebarProps) {
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrollableOverflow, setHasScrollableOverflow] = useState(false);
  const [dynamicSidebarHeight, setDynamicSidebarHeight] = useState("calc(100vh - 10.75rem)");
  const typeUiRules = getRegistryTypeUiRules(detail.typeId);
  const hasDemandData = typeUiRules.showDemandDataSection && detail.mapFields != null;
  const registryAccent = getSuiteById("registry").accent;
  const authorLinkAccentVars = {
    "--registry-author-accent-light": registryAccent.light,
    "--registry-author-accent-dark": registryAccent.dark,
  } as CSSProperties;

  const sections: Array<{ key: string; content: ReactNode }> = [];

  sections.push({
    key: "authors",
    content: (
      <SidebarSection title="Authors">
        <div className="space-y-0.5" style={authorLinkAccentVars}>
          <div className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-base font-medium text-foreground">
            <UserStar className="size-4.5 text-foreground" aria-hidden={true} />
            <span className="inline-flex items-center gap-1.5">
              {detail.authorId ? (
                <Link
                  to={`/registry/authors/${encodeURIComponent(detail.authorId)}`}
                  className="underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-author-accent-light)] hover:decoration-[color-mix(in_srgb,var(--registry-author-accent-light)_62%,transparent)] dark:hover:text-[var(--registry-author-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--registry-author-accent-dark)_62%,transparent)]"
                >
                  {detail.authorLabel}
                </Link>
              ) : (
                <span>{detail.authorLabel}</span>
              )}
              <AuthorRoleBadge authorId={detail.authorId} className="cursor-pointer" />
              {detail.authorId ? (
                <ExternalLink className="size-3.5 text-foreground" aria-hidden={true} />
              ) : null}
            </span>
          </div>

          {(detail.collaborators ?? []).map((collaborator) => (
            <div
              key={collaborator.authorId}
              className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-base font-medium text-foreground"
            >
              <UserRound className="size-4.5 text-foreground" aria-hidden={true} />
              <Link
                to={`/registry/authors/${encodeURIComponent(collaborator.authorId)}`}
                className="underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-author-accent-light)] hover:decoration-[color-mix(in_srgb,var(--registry-author-accent-light)_62%,transparent)] dark:hover:text-[var(--registry-author-accent-dark)] dark:hover:decoration-[color-mix(in_srgb,var(--registry-author-accent-dark)_62%,transparent)]"
              >
                {collaborator.authorLabel}
              </Link>
              <AuthorRoleBadge authorId={collaborator.authorId} className="cursor-pointer" />
              <Link
                to={`/registry/authors/${encodeURIComponent(collaborator.authorId)}`}
                className="inline-flex items-center"
                aria-label={`${collaborator.authorLabel} external link`}
              >
                <ExternalLink className="size-3.5 text-foreground" aria-hidden={true} />
              </Link>
            </div>
          ))}
        </div>
      </SidebarSection>
    ),
  });

  if (detail.projectId) {
    const [projectAuthor = "", projectRepoName = detail.projectId] = detail.projectId
      .split("/")
      .filter(Boolean);
    const projectHref = projectAuthor
      ? `/registry/authors/${encodeURIComponent(projectAuthor)}/${encodeURIComponent(projectRepoName)}`
      : `/registry/authors/${encodeURIComponent(projectRepoName)}`;
    sections.push({
      key: "project",
      content: (
        <SidebarSection title="Project">
          <Link
            to={projectHref}
            className="group flex items-center gap-2 rounded-lg px-1 py-1.5 text-base font-medium text-foreground"
          >
            <FolderGit2 className="size-4.5 text-foreground" aria-hidden={true} />
            <span className="underline decoration-transparent underline-offset-2 transition-colors group-hover:text-[var(--registry-type-accent)] group-hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]">
              {projectRepoName}
            </span>
            <ExternalLink className="size-3.5 text-foreground" aria-hidden={true} />
          </Link>
        </SidebarSection>
      ),
    });
  }

  if (detail.tags.length > 0) {
    sections.push({
      key: "tags",
      content: (
        <SidebarSection title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <Link
                key={tag}
                to={getRegistryTagBrowseUrl(detail.routeSegment, tag)}
                preserveScroll={true}
                className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-sm font-medium lowercase tracking-normal text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]"
                style={{
                  borderColor: `color-mix(in srgb, var(--border) 78%, transparent)`,
                  background: `color-mix(in srgb, var(--muted) 45%, transparent)`,
                }}
              >
                {tag}
              </Link>
            ))}
          </div>
        </SidebarSection>
      ),
    });
  }

  if (detail.sourceCodeLink) {
    sections.push({
      key: "links",
      content: (
        <SidebarSection title="Links">
          <a
            href={detail.sourceCodeLink.href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 rounded-lg px-1 py-1.5 text-base font-medium text-foreground"
          >
            <Code2 className="size-4.5 text-foreground" aria-hidden={true} />
            <span className="underline decoration-transparent underline-offset-2 transition-colors group-hover:text-[var(--registry-type-accent)] group-hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]">
              {detail.sourceCodeLink.label}
            </span>
            <ExternalLink className="size-4 text-foreground" aria-hidden={true} />
          </a>
        </SidebarSection>
      ),
    });
  }

  sections.push({
    key: "details",
    content: (
      <SidebarSection title="Details">
        <dl>
          <DetailRow
            icon={<CalendarDays className="size-4.5" aria-hidden={true} />}
            label="Date Published"
            value={formatDate(detail.publishedDate)}
          />
          <DetailRow
            icon={<RefreshCcw className="size-4.5" aria-hidden={true} />}
            label="Date Updated"
            value={formatDate(detail.updatedDate)}
          />
          {hasDemandData ? (
            <>
              <DemandDataRow
                icon={<BadgeCheck className="size-4.5" aria-hidden={true} />}
                label="Data Quality"
                value={detail.mapFields!.sourceQuality ?? "—"}
                tooltipContent={
                  <>
                    Data Quality refers to the quality and granularity of the source of the
                    map&apos;s demand data.{" "}
                    <Link
                      to="/registry/docs/data-quality"
                      className="underline transition-colors hover:text-[var(--dd-accent)]"
                      style={{ "--dd-accent": accentColor } as React.CSSProperties}
                    >
                      Learn more →
                    </Link>
                  </>
                }
              />
              <DemandDataRow
                icon={<Layers className="size-4.5" aria-hidden={true} />}
                label="Level of Detail"
                value={detail.mapFields!.levelOfDetail ?? "—"}
                tooltipContent={
                  <>
                    Level of Detail measures how distributed and granular the map&apos;s demand
                    points are.{" "}
                    <Link
                      to="/registry/docs/data-quality"
                      className="underline transition-colors hover:text-[var(--dd-accent)]"
                      style={{ "--dd-accent": accentColor } as React.CSSProperties}
                    >
                      Learn more →
                    </Link>
                  </>
                }
              />
            </>
          ) : null}
        </dl>
      </SidebarSection>
    ),
  });

  useLayoutEffect(() => {
    const container = scrollAreaContainerRef.current;
    if (!container) {
      setHasScrollableOverflow(false);
      return;
    }

    const viewport = container.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!viewport) {
      setHasScrollableOverflow(false);
      return;
    }

    const updateOverflowState = () => {
      const rootFontSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16",
      );
      const maxHeight = Math.max(0, Math.floor(window.innerHeight - rootFontSize * 10.75));

      const content = viewport.firstElementChild;
      const contentHeight =
        content instanceof HTMLElement
          ? Math.ceil(content.getBoundingClientRect().height)
          : viewport.scrollHeight;

      const targetHeight = Math.max(0, Math.min(maxHeight, contentHeight));
      const isOverflowing = contentHeight > targetHeight + 1;

      setDynamicSidebarHeight((prev) => {
        const next = `${targetHeight}px`;
        return prev === next ? prev : next;
      });
      setHasScrollableOverflow(isOverflowing);
    };

    updateOverflowState();

    const viewportObserver = new ResizeObserver(updateOverflowState);
    const contentObserver = new ResizeObserver(updateOverflowState);
    viewportObserver.observe(viewport);
    const content = viewport.firstElementChild;
    if (content instanceof HTMLElement) {
      contentObserver.observe(content);
    }

    window.addEventListener("resize", updateOverflowState);
    return () => {
      window.removeEventListener("resize", updateOverflowState);
      viewportObserver.disconnect();
      contentObserver.disconnect();
    };
  }, [detail.id, detail.typeId, detail.tags.length, hasDemandData]);

  const stickyTop = "8.75rem";
  return (
    <aside
      className="lg:sticky lg:self-start lg:transition-[top] lg:duration-300 lg:ease-out"
      style={{
        top: stickyTop,
        ["--registry-sidebar-height" as string]: dynamicSidebarHeight,
      }}
    >
      <div
        className="overflow-hidden rounded-2xl border-2 p-2 shadow-sm"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
          borderColor: `color-mix(in srgb, ${accentColor} 34%, var(--border))`,
        }}
      >
        <div ref={scrollAreaContainerRef}>
          <ScrollArea
            className="h-[min(70vh,36rem)] lg:h-[var(--registry-sidebar-height)]"
            scrollHideDelay={120}
          >
            <div className={`space-y-4 p-2 ${hasScrollableOverflow ? "pr-3.5" : "pr-1.5"}`}>
              {sections.map((section, index) => (
                <Fragment key={section.key}>
                  {index > 0 ? <FadedSectionSeparator /> : null}
                  {section.content}
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </aside>
  );
}
