import { memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "@/app/lib/router";
import { NavbarPanelGrid, NavbarPanelSurface, NavRow } from "@subway-builder-modded/shared-ui";
import type { SiteNavItem } from "@/app/config/site-navigation";

type NavbarPanelProps = {
  activeItem: SiteNavItem | null;
  accentColor: string;
  items: SiteNavItem[];
  mutedColor: string;
  onRowClick: () => void;
  prefersReducedMotion: boolean;
  rowsVisible: boolean;
};

type NavbarPanelContentProps = {
  items: SiteNavItem[];
  activeItem: SiteNavItem | null;
  enableRowMotion?: boolean;
  prefersReducedMotion: boolean;
  rowsVisible: boolean;
  onRowClick: () => void;
};

const ROW_DURATION = 0.18;
const ROW_STAGGER = 0.05;

export const NavbarPanelContent = memo(function NavbarPanelContent({
  items,
  activeItem,
  enableRowMotion = true,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: NavbarPanelContentProps) {
  return (
    <NavbarPanelGrid itemCount={items.length}>
      {items.map((item, index) => {
        const isActive = activeItem !== null && activeItem.id === item.id;
        const delay = rowsVisible && !prefersReducedMotion ? index * ROW_STAGGER : 0;
        const duration = prefersReducedMotion ? 0 : ROW_DURATION;
        const ItemIcon = item.icon;
        const rowContent = (
          <Link
            to={item.href}
            onClick={onRowClick}
            aria-current={isActive ? "page" : undefined}
            className="flex h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <NavRow
              title={item.title}
              description={item.description}
              icon={<ItemIcon className="size-5" aria-hidden={true} />}
              active={isActive}
              className="h-full w-full"
            />
          </Link>
        );

        return (
          <li key={item.id} className="h-full min-h-0 py-0.5">
            {enableRowMotion ? (
              <motion.div
                className="h-full"
                animate={rowsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration, delay, ease: [0.22, 0.9, 0.35, 1] }}
              >
                {rowContent}
              </motion.div>
            ) : (
              rowContent
            )}
          </li>
        );
      })}
    </NavbarPanelGrid>
  );
});

type NavbarPanelSurfaceProps = {
  accentColor: string;
  mutedColor: string;
  children: ReactNode;
};

export const NavbarPanelShell = memo(function NavbarPanelShell({
  accentColor,
  mutedColor,
  children,
}: NavbarPanelSurfaceProps) {
  return (
    <NavbarPanelSurface accentColor={accentColor} mutedColor={mutedColor}>
      {children}
    </NavbarPanelSurface>
  );
});

export const NavbarPanel = memo(function NavbarPanel({
  items,
  activeItem,
  accentColor,
  mutedColor,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: NavbarPanelProps) {
  return (
    <NavbarPanelShell accentColor={accentColor} mutedColor={mutedColor}>
      <NavbarPanelContent
        items={items}
        activeItem={activeItem}
        rowsVisible={rowsVisible}
        prefersReducedMotion={prefersReducedMotion}
        onRowClick={onRowClick}
      />
    </NavbarPanelShell>
  );
});
