import { Badge, Button } from "@subway-builder-modded/shared-ui";
import { ExternalLink, FolderOpen } from "lucide-react";
import { Link } from "@/lib/router";
import { getRegistryTagBrowseUrl } from "@/features/registry/lib/routing";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

type RegistryDetailSidebarProps = {
  detail: RegistryDetailModel;
  accentColor: string;
  onOpenInRailyard: () => void;
  onOpenImage: (index: number) => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="justify-self-end text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function RegistryDetailSidebar({
  detail,
  accentColor,
  onOpenInRailyard,
  onOpenImage: _onOpenImage,
}: RegistryDetailSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-22 lg:self-start">
      <section
        className="overflow-hidden rounded-xl border border-border/70 bg-card"
        style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
      >
        <div className="p-4">
          <dl>
            {detail.downloads !== null ? (
              <DetailRow label="Downloads" value={numberFormatter.format(detail.downloads)} />
            ) : null}
            <DetailRow label="Author" value={detail.authorLabel} />
            {detail.mapFields?.cityCode ? (
              <DetailRow label="City Code" value={detail.mapFields.cityCode} />
            ) : null}
            {detail.mapFields?.country ? (
              <DetailRow label="Country" value={detail.mapFields.country} />
            ) : null}
            {detail.mapFields?.population !== null && detail.mapFields?.population !== undefined ? (
              <DetailRow
                label="Population"
                value={numberFormatter.format(detail.mapFields.population)}
              />
            ) : null}
            {detail.latestVersion ? (
              <DetailRow label="Latest Version" value={detail.latestVersion} />
            ) : null}
          </dl>

          <div className="mt-3 flex flex-col gap-2">
            <Button
              type="button"
              className="w-full gap-2"
              style={{
                background: accentColor,
                color: "var(--background)",
              }}
              onClick={onOpenInRailyard}
            >
              <FolderOpen className="size-4" aria-hidden={true} />
              Open in Railyard
            </Button>

            {detail.authorHref ? (
              <a
                href={detail.authorHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
              >
                Author Profile
                <ExternalLink className="size-3.5" aria-hidden={true} />
              </a>
            ) : null}
          </div>

          {detail.tags.length > 0 ? (
            <section className="mt-4 space-y-2 border-t border-border/70 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={getRegistryTagBrowseUrl(detail.routeSegment, tag)}
                    preserveScroll={true}
                    className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-xs font-medium lowercase tracking-normal text-muted-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]"
                    style={{
                      borderColor: `color-mix(in srgb, var(--border) 78%, transparent)`,
                      background: `color-mix(in srgb, var(--muted) 45%, transparent)`,
                    }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {detail.sourceLinks.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source Links
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.sourceLinks.map((link) => (
                  <Badge key={link.href} variant="outline" className="px-2 py-0.5 text-xs">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5"
                    >
                      {link.label}
                      <ExternalLink className="size-3" aria-hidden={true} />
                    </a>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
