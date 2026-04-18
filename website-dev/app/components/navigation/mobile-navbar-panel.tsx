import { type CSSProperties, memo } from "react";
import { motion } from "motion/react";
import { NavRow } from "@subway-builder-modded/shared-ui";
import type { SiteNavItem, SiteSuite } from "@/app/config/site-navigation";
import { Link } from "@/app/lib/router";

export type SuiteGroup = {
  suite: SiteSuite;
  items: SiteNavItem[];
  accentColor: string;
  mutedColor: string;
};

type MobileNavbarPanelProps = {
  groups: SuiteGroup[];
  activeItem: SiteNavItem | null;
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
  onRowClick: () => void;
};

const ROW_DURATION = 0.18;
const ROW_STAGGER = 0.04;

export const MobileNavbarPanel = memo(function MobileNavbarPanel({
  groups,
  activeItem,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: MobileNavbarPanelProps) {
  let globalIndex = 0;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <section key={group.suite.id}>
            <h3
              className="mb-1.5 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: group.accentColor }}
            >
              <span className="shrink-0">{group.suite.icon}</span>
              {group.suite.title}
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

                  return (
                    <li key={item.id}>
                      <motion.div
                        animate={rowsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                        transition={{ duration, delay, ease: [0.22, 0.9, 0.35, 1] }}
                      >
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
                      </motion.div>
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

/** Static version for ghost measurement (no row motion). */
export const MobileNavbarPanelStatic = memo(function MobileNavbarPanelStatic({
  groups,
  activeItem,
  onRowClick,
}: Pick<MobileNavbarPanelProps, "groups" | "activeItem" | "onRowClick">) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <section key={group.suite.id}>
            <h3
              className="mb-1.5 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: group.accentColor }}
            >
              <span className="shrink-0">{group.suite.icon}</span>
              {group.suite.title}
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
                  const ItemIcon = item.icon;

                  return (
                    <li key={item.id}>
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
