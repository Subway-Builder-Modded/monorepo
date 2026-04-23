import { Link } from "@/lib/router";
import { SectionShell, SectionHeader } from "@subway-builder-modded/shared-ui";
import { getHomeIcon, PEOPLE_DESTINATIONS, PEOPLE_SECTION } from "@/config/home";

export function PeopleSection() {
  return (
    <SectionShell>
      <SectionHeader title={PEOPLE_SECTION.title} description={PEOPLE_SECTION.description} />

      <div className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-3">
        <div className="col-span-full h-[3px] bg-foreground/15" aria-hidden="true" />
        {PEOPLE_DESTINATIONS.map((d) => {
          const Icon = getHomeIcon(d.icon);
          return (
            <Link
              key={d.id}
              to={d.href}
              className="group relative flex flex-col bg-card/90 p-6 transition-colors hover:bg-card sm:p-7 lg:p-8"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/60 text-foreground/70 transition-colors group-hover:text-foreground">
                <Icon className="size-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold tracking-[-0.02em] text-foreground">{d.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
              <span className="mt-auto pt-5 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                {d.label} →
              </span>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}
