import { type CSSProperties, useMemo } from "react";
import { NavbarTopBar, type NavDropdownOption } from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink, SiteSuite, SiteSuiteId } from "@/app/config/site-navigation";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { NavbarActions } from "./navbar-actions";
import { SuiteSwitcher } from "./suite-switcher";

type NavbarTopbarProps = {
  breadcrumb: string;
  discordLink?: SiteCommunityLink;
  githubLink?: SiteCommunityLink;
  isDropdownOpen: boolean;
  isExpanded: boolean;
  isMobile: boolean;
  openSuiteId: SiteSuiteId;
  realAccent: string;
  realSuite: SiteSuite;
  suiteOptions: NavDropdownOption[];
  theme: ThemeMode;
  onDropdownOpenChange: (open: boolean) => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onSuiteChange: (id: string) => void;
  onThemeClick: () => void;
};

const EXPANDED_SIDE_ZONE_DESKTOP = 248;
const EXPANDED_SIDE_ZONE_MOBILE = 188;
const COLLAPSED_RIGHT_ZONE_DESKTOP = 176;
const COLLAPSED_RIGHT_ZONE_MOBILE = 176;
const COLLAPSED_LEFT_ZONE_GENERAL = 200;
const COLLAPSED_LEFT_ZONE_SUITE = 136;
const COLLAPSED_LEFT_ZONE_MOBILE = 36;
const CENTER_SAFE_GAP = 24;
const collapsedOpticalOffset = { transform: "translateY(-0.5px)" };

function getCollapsedLeftZoneWidth(isMobile: boolean, suiteId: SiteSuiteId): number {
  if (isMobile) {
    return COLLAPSED_LEFT_ZONE_MOBILE;
  }

  return suiteId === "general" ? COLLAPSED_LEFT_ZONE_GENERAL : COLLAPSED_LEFT_ZONE_SUITE;
}

function getCollapsedRightZoneWidth(isMobile: boolean): number {
  return isMobile ? COLLAPSED_RIGHT_ZONE_MOBILE : COLLAPSED_RIGHT_ZONE_DESKTOP;
}

function getExpandedSideZoneWidth(isMobile: boolean): number {
  return isMobile ? EXPANDED_SIDE_ZONE_MOBILE : EXPANDED_SIDE_ZONE_DESKTOP;
}

export function NavbarTopbar({
  breadcrumb,
  discordLink,
  githubLink,
  isDropdownOpen,
  isExpanded,
  isMobile,
  openSuiteId,
  realAccent,
  realSuite,
  suiteOptions,
  theme,
  onDropdownOpenChange,
  onOpenMenu,
  onCloseMenu,
  onSuiteChange,
  onThemeClick,
}: NavbarTopbarProps) {
  const { leftZoneWidth, rightZoneWidth, centerMaxWidth } = useMemo(() => {
    if (isExpanded) {
      const sideZoneWidth = getExpandedSideZoneWidth(isMobile);

      return {
        leftZoneWidth: sideZoneWidth,
        rightZoneWidth: sideZoneWidth,
        centerMaxWidth: `calc(100% - ${sideZoneWidth * 2 + CENTER_SAFE_GAP}px)`,
      };
    }

    const collapsedLeftZoneWidth = getCollapsedLeftZoneWidth(isMobile, realSuite.id);
    const collapsedRightZoneWidth = getCollapsedRightZoneWidth(isMobile);

    return {
      leftZoneWidth: collapsedLeftZoneWidth,
      rightZoneWidth: collapsedRightZoneWidth,
      centerMaxWidth: `calc(100% - ${collapsedLeftZoneWidth + collapsedRightZoneWidth + CENTER_SAFE_GAP}px)`,
    };
  }, [isExpanded, isMobile, realSuite.id]);

  const leftContent = isExpanded ? (
    <SuiteSwitcher
      options={suiteOptions}
      selectedId={openSuiteId}
      isOpen={isDropdownOpen}
      onOpenChange={onDropdownOpenChange}
      onSelect={onSuiteChange}
    />
  ) : (
    <div
      className="inline-flex h-full min-w-0 items-center gap-2 text-sm font-semibold leading-none"
      style={
        {
          color: realAccent,
          ...(collapsedOpticalOffset as CSSProperties),
        } as CSSProperties
      }
    >
      <span className="shrink-0">{realSuite.icon}</span>
      {!isMobile ? <span className="truncate leading-none">{realSuite.title}</span> : null}
    </div>
  );

  return (
    <NavbarTopBar
      overlayCenter
      className="h-full"
      leftClassName="min-w-0 pr-2"
      centerClassName="w-full px-2"
      rightClassName="min-w-0 pl-2"
      centerStyle={{ maxWidth: centerMaxWidth }}
      left={
        <div className="min-w-0" style={{ width: leftZoneWidth }}>
          {leftContent}
        </div>
      }
      center={
        <p
          className="truncate text-sm font-semibold leading-none text-foreground sm:text-base"
          style={isExpanded ? undefined : collapsedOpticalOffset}
        >
          {breadcrumb}
        </p>
      }
      right={
        <div className="min-w-0" style={{ width: rightZoneWidth }}>
          <NavbarActions
            discordLink={discordLink}
            githubLink={githubLink}
            isExpanded={isExpanded}
            theme={theme}
            onThemeClick={onThemeClick}
            onOpenMenu={onOpenMenu}
            onCloseMenu={onCloseMenu}
          />
        </div>
      }
    />
  );
}
