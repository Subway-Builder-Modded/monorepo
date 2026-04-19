import { Heart, MessageCircle, Users } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { SectionShell, SectionHeader } from "@subway-builder-modded/shared-ui";

const DESTINATIONS = [
  {
    id: "community",
    icon: MessageCircle,
    title: "Community",
    description:
      "Get support, share feedback, show off your creations, and help shape the roadmap alongside other builders.",
    href: "/community",
    label: "Community Hub",
    accent: { light: "#0f8f68", dark: "#19d89c" },
  },
  {
    id: "credits",
    icon: Users,
    title: "Credits",
    description:
      "The maintainers, collaborators, contributors, and financial supporters who keep the ecosystem moving forward.",
    href: "/credits",
    label: "View Credits",
    accent: { light: "#9d4edd", dark: "#c77dff" },
  },
  {
    id: "contribute",
    icon: Heart,
    title: "Contribute",
    description:
      "Support ongoing development and help ship new features faster while keeping everything free and open.",
    href: "/contribute",
    label: "Support the Project",
    accent: { light: "#f2992e", dark: "#ffbe73" },
  },
] as const;

export function PeopleSection() {
  return (
    <SectionShell>
      <SectionHeader
        title="Built by the community, for the community"
        description="Meet the people behind Subway Builder Modded — and find your way to join them."
      />

      <div className="grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-3">
        {DESTINATIONS.map((d) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.id}
              to={d.href}
              className="group relative flex flex-col bg-card/90 p-6 transition-colors hover:bg-card sm:p-7 lg:p-8"
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px] transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: d.accent.light, opacity: 0.5 }}
                aria-hidden="true"
              />
              <div
                className={cn(
                  "absolute inset-x-0 top-0 hidden h-[3px] transition-opacity group-hover:opacity-100 dark:block",
                )}
                style={{ backgroundColor: d.accent.dark, opacity: 0.5 }}
                aria-hidden="true"
              />
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
