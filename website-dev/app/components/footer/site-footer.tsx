import { Link } from "@/app/lib/router";
import { WEBSITE_DEV_COMMUNITY_LINKS, WEBSITE_DEV_SUITES } from "@/app/lib/site-navigation";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "@/app/components/navigation/site-icon";

export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-border/80 bg-[color:color-mix(in_srgb,var(--surface-raised)_76%,transparent)]">
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-10 pt-8 sm:px-7 lg:px-10">
        <div className="mb-6 grid grid-cols-5 gap-2" aria-hidden="true">
          {WEBSITE_DEV_SUITES.map((suite) => (
            <span
              key={suite.id}
              className="h-[3px] rounded-full"
              style={{
                background: `linear-gradient(90deg, ${suite.accent.light}, transparent)`,
              }}
            />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card">
                <SiteIcon iconKey="logo" className="size-6" />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Subway Builder Modded</h2>
                <p className="text-sm text-muted-foreground">
                  Premium transit-inspired interfaces for modding tools and ecosystem services.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {WEBSITE_DEV_SUITES.map((suite) => {
                return (
                  <div
                    key={suite.id}
                    className="rounded-2xl border border-border/70 bg-card/70 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-flex size-7 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: suite.accent.light }}
                      >
                        <SiteIcon iconKey={suite.iconKey} className="size-3.5" />
                      </span>
                      <h3 className="text-sm font-semibold">{suite.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {suite.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            to={item.href}
                            className={cn(
                              "group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition",
                              "hover:bg-[color:color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] hover:text-foreground",
                            )}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: suite.accent.light }}
                              aria-hidden="true"
                            />
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 lg:min-w-[240px]">
            <h3 className="mb-3 text-sm font-semibold tracking-wide">Community</h3>
            <ul className="space-y-2">
              {WEBSITE_DEV_COMMUNITY_LINKS.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SiteIcon iconKey={item.iconKey} className="size-4" />
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Subway Builder Modded. Built by the community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
