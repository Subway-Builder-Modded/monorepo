import { memo } from "react";
import type { NavbarSuiteRailItem } from "@/app/components/navigation/navbar-model";
import type { SiteNavItem, SiteSuiteId } from "@/app/config/site-navigation";
import { SuiteRail } from "./suite-rail";
import { NavbarPanelContent, NavbarPanelShell } from "./navbar-panel";

type DesktopNavbarPanelProps = {
  suiteRailItems: NavbarSuiteRailItem[];
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

type DesktopPanelBaseProps = {
  suiteRailItems: NavbarSuiteRailItem[];
  selectedSuiteId: SiteSuiteId;
  onSuiteSelect: (id: SiteSuiteId) => void;
  items: SiteNavItem[];
  activeItem: SiteNavItem | null;
  accentColor: string;
  mutedColor: string;
  onRowClick: () => void;
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
  enableRowMotion: boolean;
};

const DesktopNavbarPanelBase = memo(function DesktopNavbarPanelBase({
  suiteRailItems,
  selectedSuiteId,
  onSuiteSelect,
  items,
  activeItem,
  accentColor,
  mutedColor,
  onRowClick,
  rowsVisible,
  prefersReducedMotion,
  enableRowMotion,
}: DesktopPanelBaseProps) {
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
            enableRowMotion={enableRowMotion}
            prefersReducedMotion={prefersReducedMotion}
            onRowClick={onRowClick}
          />
        </NavbarPanelShell>
      </div>
    </div>
  );
});

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
    <DesktopNavbarPanelBase
      suiteRailItems={suiteRailItems}
      selectedSuiteId={selectedSuiteId}
      onSuiteSelect={onSuiteSelect}
      items={items}
      activeItem={activeItem}
      accentColor={accentColor}
      mutedColor={mutedColor}
      onRowClick={onRowClick}
      rowsVisible={rowsVisible}
      prefersReducedMotion={prefersReducedMotion}
      enableRowMotion={true}
    />
  );
});

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
    <DesktopNavbarPanelBase
      suiteRailItems={suiteRailItems}
      selectedSuiteId={selectedSuiteId}
      onSuiteSelect={() => undefined}
      items={items}
      activeItem={activeItem}
      accentColor={accentColor}
      mutedColor={mutedColor}
      onRowClick={onRowClick}
      rowsVisible={true}
      prefersReducedMotion={true}
      enableRowMotion={false}
    />
  );
});
