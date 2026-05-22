import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@subway-builder-modded/shared-ui";
import { ArrowUpRight, ExternalLink, FolderOpen } from "lucide-react";
import { Link } from "@/lib/router";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

type RegistryDetailHeaderProps = {
  detail: RegistryDetailModel;
  accentColor: string;
  onOpenInRailyard: () => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function RegistryDetailHeader({
  detail,
  accentColor,
  onOpenInRailyard,
}: RegistryDetailHeaderProps) {
  return (
    <header className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/registry">Registry</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/registry">{detail.typeConfig.pluralLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{detail.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border px-2.5 py-0.5"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 26%, transparent)`,
                  background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                }}
              >
                {detail.typeConfig.label}
              </Badge>
              {detail.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border px-2 py-0.5 text-xs"
                  style={{
                    borderColor: `color-mix(in srgb, ${accentColor} 20%, var(--border))`,
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {detail.name}
              </h1>
              {detail.excerpt ? (
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {detail.excerpt}
                </p>
              ) : null}
            </div>

            <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {detail.downloads !== null ? (
                <div className="flex items-center gap-1.5">
                  <dt>Downloads</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {numberFormatter.format(detail.downloads)}
                  </dd>
                </div>
              ) : null}
              {detail.latestVersion ? (
                <div className="flex items-center gap-1.5">
                  <dt>Latest Version</dt>
                  <dd className="font-medium text-foreground">{detail.latestVersion}</dd>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <dt>Author</dt>
                <dd>
                  {detail.authorHref ? (
                    <a
                      href={detail.authorHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--registry-type-accent)] hover:decoration-current"
                    >
                      {detail.authorLabel}
                      <ExternalLink className="size-3.5" aria-hidden={true} />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{detail.authorLabel}</span>
                  )}
                </dd>
              </div>
            </dl>

            {detail.sourceLinks.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {detail.sourceLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5" aria-hidden={true} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full shrink-0 gap-2 lg:w-auto"
            style={{
              background: accentColor,
              color: "var(--background)",
            }}
            onClick={onOpenInRailyard}
          >
            <FolderOpen className="size-4" aria-hidden={true} />
            Open in Railyard
          </Button>
        </div>
      </div>
    </header>
  );
}
