import { memo } from "react";
import type { SiteNavItem, SiteSuiteId } from "@/app/config/site-navigation";
import { SuiteRail, type SuiteRailItem } from "./suite-rail";
import { NavbarPanelContent, NavbarPanelShell } from "./navbar-panel";

type DesktopNavbarPanelProps = {
  suiteRailItems: SuiteRailItem[];
  selectedSuiteId: SiteSuiteId;
  onSuiteSelect: (id: SiteSuiteId) => void;
  items: SiteNavItem[];
  activeItem: SiteNavItem | null;
  accentColor: string;
  mutedColor: string;
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
  onRowClick: () => void;
};

export const DesktopNavbarPanel = memo(function DesktopNavbarPanel({
  suiteRailItems,
  selectedSuiteId,
  onSuiteSelect,
  items,
  activeItem,
  accentColor,
  mutedColor,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: DesktopNavbarPanelProps) {
  return (
    <div className="flex gap-3">
      <div className="w-48 shrink-0 border-r border-border/40 pr-3">
        <SuiteRail items={suiteRailItems} selectedId={selectedSuiteId} onSelect={onSuiteSelect} />
      </div>
      <div className="min-w-0 flex-1">
        <NavbarPanelShell accentColor={accentColor} mutedColor={mutedColor}>
          <NavbarPanelContent
            items={items}
            activeItem={activeItem}
            rowsVisible={rowsVisible}
            prefersReducedMotion={prefersReducedMotion}
            onRowClick={onRowClick}
          />
        </NavbarPanelShell>
      </div>
    </div>
  );
});

/** Static version for ghost measurement (no row motion). */
export const DesktopNavbarPanelStatic = memo(function DesktopNavbarPanelStatic({
  suiteRailItems,
  selectedSuiteId,
  items,
  activeItem,
  accentColor,
  mutedColor,
  onRowClick,
}: Omit<DesktopNavbarPanelProps, "rowsVisible" | "prefersReducedMotion" | "onSuiteSelect">) {
  return (
    <div className="flex gap-3">
      <div className="w-48 shrink-0 border-r border-border/40 pr-3">
        <SuiteRail items={suiteRailItems} selectedId={selectedSuiteId} onSelect={() => undefined} />
      </div>
      <div className="min-w-0 flex-1">
        <NavbarPanelShell accentColor={accentColor} mutedColor={mutedColor}>
          <NavbarPanelContent
            items={items}
            activeItem={activeItem}
            rowsVisible={true}
            enableRowMotion={false}
            prefersReducedMotion={true}
            onRowClick={onRowClick}
          />
        </NavbarPanelShell>
      </div>
    </div>
  );
});
