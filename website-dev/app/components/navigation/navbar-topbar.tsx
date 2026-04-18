import type { ReactNode } from "react";
import { NavbarTopBar } from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink, SiteSuite } from "@/app/config/site-navigation";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { Link } from "@/app/lib/router";
import { NavbarActions } from "./navbar-actions";

type NavbarTopbarProps = {
  breadcrumb: string;
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
  breadcrumbNode: ReactNode;
};

const LEFT_ZONE_WIDTH = 240;
const RIGHT_ZONE_WIDTH = 200;
const CENTER_SAFE_GAP = 24;
const CENTER_MAX_WIDTH = `calc(100% - ${LEFT_ZONE_WIDTH + RIGHT_ZONE_WIDTH + CENTER_SAFE_GAP}px)`;

function DesktopNavbarTopbar({ actionsNode, brandNode, breadcrumbNode }: SharedTopbarLayoutProps) {
  return (
    <NavbarTopBar
      overlayCenter
      className="h-full"
      leftClassName="min-w-0 pr-2"
      centerClassName="w-full px-2"
      rightClassName="min-w-0 pl-2"
      centerStyle={{ maxWidth: CENTER_MAX_WIDTH }}
      left={
        <div className="min-w-0" style={{ width: LEFT_ZONE_WIDTH }}>
          {brandNode}
        </div>
      }
      center={breadcrumbNode}
      right={
        <div className="min-w-0" style={{ width: RIGHT_ZONE_WIDTH }}>
          {actionsNode}
        </div>
      }
    />
  );
}

function MobileNavbarTopbar({ actionsNode, brandNode, breadcrumbNode }: SharedTopbarLayoutProps) {
  return (
    <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
      <div className="min-w-0 pr-1">{brandNode}</div>
      <div className="min-w-0 px-1">{breadcrumbNode}</div>
      <div className="shrink-0 pl-1">{actionsNode}</div>
    </div>
  );
}

export function NavbarTopbar({
  breadcrumb,
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
  const brandNode = (
    <Link
      to="/"
      aria-label="Go to home"
      className="inline-flex h-full min-w-0 items-center gap-2 rounded-lg text-sm font-semibold leading-tight text-white outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img src="/logo.svg" alt="" aria-hidden="true" className="size-4 shrink-0 object-contain" />
      {!isMobile ? (
        <span className="inline-block max-w-full pb-[2px] text-ellipsis whitespace-nowrap leading-tight [overflow-x:hidden] [overflow-y:visible]">
          Subway Builder Modded
        </span>
      ) : null}
    </Link>
  );

  const breadcrumbNode = (
    <p
      className="flex items-center justify-center gap-1.5 pb-[3px] text-ellipsis whitespace-nowrap text-center text-sm font-semibold leading-snug [overflow-x:hidden] [overflow-y:visible] sm:text-base"
      style={{ transform: "translateY(-2px)" }}
    >
      <span
        className="inline-flex shrink-0 items-center [&_svg]:size-3.5"
        style={{ color: realAccent }}
        aria-hidden="true"
      >
        {realSuite.icon}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="text-foreground">{breadcrumb}</span>
    </p>
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
        breadcrumbNode={breadcrumbNode}
      />
    );
  }

  return (
    <DesktopNavbarTopbar
      actionsNode={actionsNode}
      brandNode={brandNode}
      breadcrumbNode={breadcrumbNode}
    />
  );
}
