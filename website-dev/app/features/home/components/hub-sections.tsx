import { Heart, MessageCircle, Users } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { SectionHeader } from "@subway-builder-modded/shared-ui";

const HOMEPAGE_SHELL = "mx-auto w-full max-w-[1600px] px-5 sm:px-7 lg:px-10 xl:px-12";

const DESTINATIONS = [
  {
    id: "community",
    icon: MessageCircle,
    title: "Community",
    description:
      "Get support, share feedback, show off your creations, and help shape the roadmap alongside other builders.",
    href: "/community",
    label: "Community Hub",
  },
  {
    id: "credits",
    icon: Users,
    title: "Credits",
    description:
      "The maintainers, collaborators, contributors, and financial supporters who keep the ecosystem moving forward.",
    href: "/credits",
    label: "View Credits",
  },
  {
    id: "contribute",
    icon: Heart,
    title: "Contribute",
    description:
      "Support ongoing development and help ship new features faster while keeping everything free and open.",
    href: "/contribute",
    label: "Support the Project",
  },
] as const;

export function PeopleSection() {
  return (
    <section className={cn("py-14 lg:py-20", HOMEPAGE_SHELL)}>
      <SectionHeader
        kicker="People"
        title="Built by the community, for the community"
        description="Meet the people behind Subway Builder Modded — and find your way to join them."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((d) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.id}
              to={d.href}
              className="group relative flex flex-col rounded-xl border border-border/60 bg-card/80 p-5 transition-colors hover:border-border hover:bg-card sm:p-6"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted/60 text-foreground/70 transition-colors group-hover:text-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {d.description}
              </p>
              <span className="mt-4 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {d.label} →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
