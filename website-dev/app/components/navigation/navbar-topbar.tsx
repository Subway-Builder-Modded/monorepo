import { useMemo } from "react";
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
const COLLAPSED_RIGHT_ZONE_DESKTOP = 176;
const COLLAPSED_LEFT_ZONE_GENERAL = 200;
const COLLAPSED_LEFT_ZONE_SUITE = 136;
const CENTER_SAFE_GAP = 24;

function getCollapsedLeftZoneWidth(suiteId: SiteSuiteId): number {
  return suiteId === "general" ? COLLAPSED_LEFT_ZONE_GENERAL : COLLAPSED_LEFT_ZONE_SUITE;
}

function getExpandedSideZoneWidth(): number {
  return EXPANDED_SIDE_ZONE_DESKTOP;
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
  const selectedSuiteAccent = useMemo(() => {
    return suiteOptions.find((option) => option.id === openSuiteId)?.tone?.color;
  }, [openSuiteId, suiteOptions]);

  const { leftZoneWidth, rightZoneWidth, centerMaxWidth } = useMemo(() => {
    if (isExpanded) {
      const sideZoneWidth = getExpandedSideZoneWidth();

      return {
        leftZoneWidth: sideZoneWidth,
        rightZoneWidth: sideZoneWidth,
        centerMaxWidth: `calc(100% - ${sideZoneWidth * 2 + CENTER_SAFE_GAP}px)`,
      };
    }

    const collapsedLeftZoneWidth = getCollapsedLeftZoneWidth(realSuite.id);
    const collapsedRightZoneWidth = COLLAPSED_RIGHT_ZONE_DESKTOP;

    return {
      leftZoneWidth: collapsedLeftZoneWidth,
      rightZoneWidth: collapsedRightZoneWidth,
      centerMaxWidth: `calc(100% - ${collapsedLeftZoneWidth + collapsedRightZoneWidth + CENTER_SAFE_GAP}px)`,
    };
  }, [isExpanded, realSuite.id]);

  const expandedLeftContent = (
    <div style={{ color: selectedSuiteAccent ?? realAccent }}>
      <SuiteSwitcher
        options={suiteOptions}
        selectedId={openSuiteId}
        isOpen={isDropdownOpen}
        onOpenChange={onDropdownOpenChange}
        onSelect={onSuiteChange}
        compact={isMobile}
      />
    </div>
  );

  const collapsedLeftContent = (
    <div
      className="inline-flex h-full min-w-0 items-center gap-2 text-sm font-semibold leading-tight"
      style={{ color: realAccent }}
    >
      <span className="shrink-0">{realSuite.icon}</span>
      {!isMobile ? (
        <span className="inline-block max-w-full pb-[2px] text-ellipsis whitespace-nowrap leading-tight [overflow-x:hidden] [overflow-y:visible]">
          {realSuite.title}
        </span>
      ) : null}
    </div>
  );

  const breadcrumbNode = (
    <p
      className="pb-[3px] text-ellipsis whitespace-nowrap text-center text-sm font-semibold leading-snug text-foreground [overflow-x:hidden] [overflow-y:visible] sm:text-base"
      style={{ transform: "translateY(-2px)" }}
    >
      {breadcrumb}
    </p>
  );

  const actionsNode = (
    <NavbarActions
      discordLink={discordLink}
      githubLink={githubLink}
      isExpanded={isExpanded}
      theme={theme}
      onThemeClick={onThemeClick}
      onOpenMenu={onOpenMenu}
      onCloseMenu={onCloseMenu}
    />
  );

  if (isMobile) {
    return (
      <NavbarTopBar
        className="h-full gap-1"
        leftClassName="min-w-0 pr-1"
        centerClassName="px-1"
        rightClassName="pl-1"
        left={
          isExpanded ? (
            <div className="min-w-0 max-w-[2.5rem]">{expandedLeftContent}</div>
          ) : (
            <div className="min-w-0">{collapsedLeftContent}</div>
          )
        }
        center={breadcrumbNode}
        right={<div className="shrink-0">{actionsNode}</div>}
      />
    );
  }

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
          {isExpanded ? expandedLeftContent : collapsedLeftContent}
        </div>
      }
      center={breadcrumbNode}
      right={
        <div className="min-w-0" style={{ width: rightZoneWidth }}>
          {actionsNode}
        </div>
      }
    />
  );
}
