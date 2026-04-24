import { useEffect, useState } from "react";
import {
  FileQuestion,
  ExternalLink,
  Link as LinkIcon,
  CodeXml,
  UsersRound,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PageHeading,
  SuiteAccentScope,
  SectionSeparator,
  DirectoryCard,
} from "@subway-builder-modded/shared-ui";
import { Link, useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { loadCreditsDirectory, isExternalHref } from "@/features/credits/lib/content";
import { matchCreditsRoute } from "@/features/credits/lib/routing";
import type {
  CreditsDirectory,
  CreditsPerson,
  CreditsSection,
  CreditsSubsection,
  CreditsSubsectionId,
} from "@/features/credits/lib/types";
import { cn } from "@/lib/utils";

type CreditsState =
  | { status: "loading" }
  | { status: "ready"; directory: CreditsDirectory }
  | { status: "error" };

const SUBSECTION_STYLES: Record<
  CreditsSubsectionId,
  { icon: LucideIcon; accentLight: string; accentDark: string }
> = {
  developer: { icon: CodeXml, accentLight: "#5296D5", accentDark: "#5296D5" },
  collaborator: { icon: UsersRound, accentLight: "#925CB1", accentDark: "#925CB1" },
  executive: { icon: Heart, accentLight: "#D8833B", accentDark: "#D8833B" },
  conductor: { icon: Heart, accentLight: "#9F2757", accentDark: "#9F2757" },
  engineer: { icon: Heart, accentLight: "#D65745", accentDark: "#D65745" },
};

function PersonCard({
  person,
  icon: Icon,
  accentLight,
  accentDark,
}: {
  person: CreditsPerson;
  icon: LucideIcon;
  accentLight: string;
  accentDark: string;
}) {

  const trailing = person.link
    ? isExternalHref(person.link)
      ? (
          <ExternalLink
            className="size-[clamp(0.8rem,1.2vw,0.95rem)] text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            aria-label="External profile link"
          />
        )
      : (
          <LinkIcon
            className="size-[clamp(0.8rem,1.2vw,0.95rem)] text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            aria-label="Profile link"
          />
        )
    : null;

  if (!person.link) {
    return (
      <DirectoryCard
        interactive={person.source === "supporters"}
        showChevron={false}
        icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
        heading={person.displayName}
        trailing={trailing}
        accentLight={accentLight}
        accentDark={accentDark}
        data-source={person.source}
      />
    );
  }

  if (isExternalHref(person.link)) {
    return (
      <DirectoryCard
        asChild
        showChevron={false}
        icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
        heading={person.displayName}
        trailing={trailing}
        accentLight={accentLight}
        accentDark={accentDark}
      >
        <a href={person.link} target="_blank" rel="noopener noreferrer" />
      </DirectoryCard>
    );
  }

  return (
    <DirectoryCard
      asChild
      showChevron={false}
      icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
      heading={person.displayName}
      trailing={trailing}
      accentLight={accentLight}
      accentDark={accentDark}
    >
      <Link to={person.link}>{null}</Link>
    </DirectoryCard>
  );
}

function CreditsSubsectionBlock({ subsection }: { subsection: CreditsSubsection }) {
  const subsectionStyle = SUBSECTION_STYLES[subsection.id];
  const SubsectionIcon = subsectionStyle.icon;

  return (
    <section data-testid={`credits-subsection-${subsection.id}`}>
      <SectionSeparator
        label={subsection.title}
        icon={SubsectionIcon}
        testId={`credits-subsection-icon-${subsection.id}`}
        headingLevel={3}
        className="mb-[clamp(0.55rem,1.1vw,0.85rem)]"
      />

      <ul
        className="grid grid-cols-1 gap-[var(--credits-gap)] [--credits-gap:clamp(0.55rem,1.2vw,0.9rem)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {subsection.people.map((person) => (
          <li key={person.key}>
            <PersonCard
              person={person}
              icon={SubsectionIcon}
              accentLight={subsectionStyle.accentLight}
              accentDark={subsectionStyle.accentDark}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreditsSectionBlock({ section }: { section: CreditsSection }) {
  return (
    <section className="space-y-[clamp(0.85rem,1.8vw,1.35rem)]" data-testid={`credits-section-${section.id}`}>
      <header>
        <h2 className="text-[clamp(1.25rem,2.6vw,2rem)] font-bold tracking-[-0.01em] text-foreground">
          {section.title}
        </h2>
        <p className="mt-[clamp(0.2rem,0.65vw,0.45rem)] text-[clamp(0.88rem,1.2vw,1rem)] leading-relaxed text-muted-foreground">
          {section.description}
        </p>
      </header>

      <div className="space-y-[clamp(0.9rem,2vw,1.5rem)]">
        {section.subsections.map((subsection) => (
          <CreditsSubsectionBlock key={subsection.id} subsection={subsection} />
        ))}
      </div>
    </section>
  );
}

export function CreditsRoute() {
  const location = useLocation();
  const match = matchCreditsRoute(location.pathname);

  const [state, setState] = useState<CreditsState>({ status: "loading" });

  useEffect(() => {
    if (match.kind !== "page") {
      return;
    }

    let disposed = false;

    async function run() {
      const directory = await loadCreditsDirectory();
      if (disposed) return;
      setState({ status: "ready", directory });
    }

    run().catch(() => {
      if (!disposed) {
        setState({ status: "error" });
      }
    });

    return () => {
      disposed = true;
    };
  }, [match.kind]);

  if (match.kind !== "page") {
    return null;
  }

  const navItem = getMatchingItem(location.pathname, "general");

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground" aria-hidden="true" />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">Page Not Found</h1>
        <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);
  const sections =
    state.status === "ready"
      ? state.directory.sections
          .map((section) => ({
            ...section,
            subsections: section.subsections.filter((subsection) => subsection.people.length > 0),
          }))
          .filter((section) => section.subsections.length > 0)
      : [];

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />

        <div className="space-y-[clamp(1.15rem,3vw,2.5rem)] py-[clamp(1rem,2.8vw,2rem)]">
          {state.status === "ready"
            ? sections.map((section) => <CreditsSectionBlock key={section.id} section={section} />)
            : null}
        </div>
      </section>
    </SuiteAccentScope>
  );
}
