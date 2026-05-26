import { Button } from "@subway-builder-modded/shared-ui";
import { Code2, Download, UserRound } from "lucide-react";
import type { ReactNode } from "react";
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
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="justify-self-end text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
          <div className="space-y-4">
            <SidebarSection title="Links">
              <div className="space-y-1">
                {detail.sourceCodeLink ? (
                  <a
                    href={detail.sourceCodeLink.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-[var(--registry-type-accent)]"
                  >
                    <Code2 className="size-4 text-muted-foreground" aria-hidden={true} />
                    <span>{detail.sourceCodeLink.label}</span>
                  </a>
                ) : null}

                <Button
                  type="button"
                  className="w-full justify-start gap-2 px-1 py-1.5 text-left text-sm text-foreground"
                  variant="ghost"
                  onClick={onOpenInRailyard}
                >
                  <Download className="size-4 text-muted-foreground" aria-hidden={true} />
                  Download
                </Button>
              </div>
            </SidebarSection>

            <SidebarSection title="Creators">
              {detail.authorHref ? (
                <a
                  href={detail.authorHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-[var(--registry-type-accent)]"
                >
                  <UserRound className="size-4 text-muted-foreground" aria-hidden={true} />
                  <span>{detail.authorLabel}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-foreground">
                  <UserRound className="size-4 text-muted-foreground" aria-hidden={true} />
                  <span>{detail.authorLabel}</span>
                </div>
              )}
            </SidebarSection>

            <SidebarSection title="Details">
              <dl>
                <DetailRow label="Date Published" value={formatDate(detail.publishedDate)} />
                <DetailRow label="Date Updated" value={formatDate(detail.updatedDate)} />
                <DetailRow
                  label="Version Count"
                  value={numberFormatter.format(detail.integrityVersionCount)}
                />
              </dl>
            </SidebarSection>

            {detail.tags.length > 0 ? (
              <SidebarSection title="Tags">
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
              </SidebarSection>
            ) : null}
          </div>
        </div>
      </section>
    </aside>
  );
}
