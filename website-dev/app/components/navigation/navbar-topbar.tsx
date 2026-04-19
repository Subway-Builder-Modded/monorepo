import type { ReactNode } from "react";
import { NavbarTopBar } from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink, SiteSuite } from "@/app/config/site-navigation";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { Link } from "@/app/lib/router";
import { NavbarActions } from "./navbar-actions";

type NavbarTopbarProps = {
  discordLink?: SiteCommunityLink;
  githubLink?: SiteCommunityLink;
  isExpanded: boolean;
  isMobile: boolean;
  realAccent: string;
  realSuite: SiteSuite;
  theme: ThemeMode;
  onMenuClick: () => void;
  onThemeClick: () => void;
};

type SharedTopbarLayoutProps = {
  actionsNode: ReactNode;
  brandNode: ReactNode;
  suiteIndicator: ReactNode;
};

function DesktopNavbarTopbar({ actionsNode, brandNode, suiteIndicator }: SharedTopbarLayoutProps) {
  return (
    <NavbarTopBar
      className="h-full"
      leftClassName="min-w-0 pr-2"
      rightClassName="min-w-0 pl-2"
      left={
        <div className="flex min-w-0 items-center gap-3">
          {brandNode}
          {suiteIndicator}
        </div>
      }
      right={actionsNode}
    />
  );
}

function MobileNavbarTopbar({ actionsNode, brandNode, suiteIndicator }: SharedTopbarLayoutProps) {
  return (
    <div className="flex h-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {brandNode}
        {suiteIndicator}
      </div>
      <div className="shrink-0">{actionsNode}</div>
    </div>
  );
}

export function NavbarTopbar({
  discordLink,
  githubLink,
  isExpanded,
  isMobile,
  realAccent,
  realSuite,
  theme,
  onMenuClick,
  onThemeClick,
}: NavbarTopbarProps) {
  const SuiteIcon = realSuite.icon;

  const brandNode = (
    <Link
      to="/"
      aria-label="Go to home"
      className="inline-flex h-full min-w-0 items-center gap-2 rounded-lg text-sm font-semibold leading-tight text-foreground/90 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:text-muted-foreground dark:hover:text-foreground"
    >
      <img src="/logo.svg" alt="" aria-hidden="true" className="size-4 shrink-0 object-contain" />
      {!isMobile ? (
        <span className="inline-block max-w-full pb-[2px] text-ellipsis whitespace-nowrap leading-tight [overflow-x:hidden] [overflow-y:visible]">
          Subway Builder Modded
        </span>
      ) : null}
    </Link>
  );

  const suiteIndicator = (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold"
      style={{ color: realAccent, backgroundColor: `${realAccent}14` }}
    >
      <SuiteIcon className="size-3.5" aria-hidden={true} />
      <span className="max-w-[8rem] truncate">{realSuite.title}</span>
    </span>
  );

  const actionsNode = (
    <NavbarActions
      discordLink={discordLink}
      githubLink={githubLink}
      isExpanded={isExpanded}
      theme={theme}
      onThemeClick={onThemeClick}
      onMenuClick={onMenuClick}
    />
  );

  if (isMobile) {
    return (
      <MobileNavbarTopbar
        actionsNode={actionsNode}
        brandNode={brandNode}
        suiteIndicator={suiteIndicator}
      />
    );
  }

  return (
    <DesktopNavbarTopbar
      actionsNode={actionsNode}
      brandNode={brandNode}
      suiteIndicator={suiteIndicator}
    />
  );
}
