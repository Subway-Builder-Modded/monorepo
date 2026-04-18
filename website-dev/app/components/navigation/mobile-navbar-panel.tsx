import { type CSSProperties, memo } from "react";
import { motion } from "motion/react";
import { NavRow } from "@subway-builder-modded/shared-ui";
import type { NavbarMobileSuiteGroup } from "@/app/components/navigation/navbar-model";
import type { SiteNavItem } from "@/app/config/site-navigation";
import { Link } from "@/app/lib/router";

type MobileNavbarPanelProps = {
  groups: NavbarMobileSuiteGroup[];
  activeItem: SiteNavItem | null;
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
  onRowClick: () => void;
};

type MobileNavbarPanelBaseProps = {
  groups: NavbarMobileSuiteGroup[];
  activeItem: SiteNavItem | null;
  onRowClick: () => void;
  enableRowMotion: boolean;
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
};

const ROW_DURATION = 0.18;
const ROW_STAGGER = 0.04;

const MobileNavbarPanelBase = memo(function MobileNavbarPanelBase({
  groups,
  activeItem,
  onRowClick,
  enableRowMotion,
  rowsVisible,
  prefersReducedMotion,
}: MobileNavbarPanelBaseProps) {
  let globalIndex = 0;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <section key={group.id}>
            <h3
              className="mb-1.5 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: group.accentColor }}
            >
              <span className="shrink-0">{group.icon}</span>
              {group.title}
            </h3>
            <div
              style={
                {
                  ["--nav-accent"]: group.accentColor,
                  ["--nav-muted"]: group.mutedColor,
                } as CSSProperties
              }
            >
              <ul role="list" className="grid grid-cols-1 gap-1">
                {group.items.map((item) => {
                  const isActive = activeItem?.id === item.id;
                  const currentIndex = globalIndex++;
                  const delay =
                    rowsVisible && !prefersReducedMotion ? currentIndex * ROW_STAGGER : 0;
                  const duration = prefersReducedMotion ? 0 : ROW_DURATION;
                  const ItemIcon = item.icon;
                  const rowContent = (
                    <Link
                      to={item.href}
                      onClick={onRowClick}
                      aria-current={isActive ? "page" : undefined}
                      className="flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <NavRow
                        title={item.title}
                        description={item.description}
                        icon={<ItemIcon className="size-5" aria-hidden={true} />}
                        active={isActive}
                        className="w-full"
                      />
                    </Link>
                  );

                  return (
                    <li key={item.id}>
                      {enableRowMotion ? (
                        <motion.div
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
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
});

export const MobileNavbarPanel = memo(function MobileNavbarPanel({
  groups,
  activeItem,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: MobileNavbarPanelProps) {
  return (
    <MobileNavbarPanelBase
      groups={groups}
      activeItem={activeItem}
      onRowClick={onRowClick}
      enableRowMotion={true}
      rowsVisible={rowsVisible}
      prefersReducedMotion={prefersReducedMotion}
    />
  );
});

/** Static version for ghost measurement (no row motion). */
export const MobileNavbarPanelStatic = memo(function MobileNavbarPanelStatic({
  groups,
  activeItem,
  onRowClick,
}: Pick<MobileNavbarPanelProps, "groups" | "activeItem" | "onRowClick">) {
  return (
    <MobileNavbarPanelBase
      groups={groups}
      activeItem={activeItem}
      onRowClick={onRowClick}
      enableRowMotion={false}
      rowsVisible={true}
      prefersReducedMotion={true}
    />
  );
});
