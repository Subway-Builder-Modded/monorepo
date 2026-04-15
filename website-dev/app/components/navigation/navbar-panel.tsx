import { type CSSProperties, memo } from "react";
import { motion } from "motion/react";
import { Link } from "@/app/lib/router";
import { ShellNavRow } from "@subway-builder-modded/shared-ui";
import { SiteIcon } from "./site-icon";
import type { SiteSuiteConfig, SiteSuiteNavItem } from "@/app/lib/site-navigation";

type NavbarPanelProps = {
  suite: SiteSuiteConfig;
  activeItem: SiteSuiteNavItem | null;
  accentColor: string;
  accentContrast: string;
  /** When true rows animate to visible; when false rows animate out. */
  rowsVisible: boolean;
  prefersReducedMotion: boolean;
  onRowClick: () => void;
};

const ROW_DURATION = 0.18;
const ROW_STAGGER = 0.05;

export const NavbarPanel = memo(function NavbarPanel({
  suite,
  activeItem,
  accentColor,
  accentContrast,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: NavbarPanelProps) {
  const borderColor = `color-mix(in srgb, ${accentColor} 36%, var(--border))`;

  return (
    <div
      className="rounded-b-2xl border-x-2 border-b-2 bg-background px-3 pb-3 pt-1"
      style={
        {
          borderColor: borderColor,
          ["--suite-accent" as string]: accentColor,
          ["--suite-accent-contrast" as string]: accentContrast,
        } as CSSProperties
      }
    >
      {/* One or two column list, constrained so a single item doesn't span full width */}
      <ul
        role="list"
        className={
          suite.items.length === 1 ? "max-w-sm" : "grid gap-x-3 sm:grid-cols-2 xl:max-w-2xl"
        }
      >
        {suite.items.map((item, index) => {
          const isActive = activeItem !== null && activeItem.id === item.id;
          const delay = rowsVisible && !prefersReducedMotion ? index * ROW_STAGGER : 0;
          const duration = prefersReducedMotion ? 0 : ROW_DURATION;

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
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ShellNavRow
                    title={item.title}
                    description={item.description}
                    icon={<SiteIcon iconKey={item.iconKey} className="size-5" />}
                    active={isActive}
                  />
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
