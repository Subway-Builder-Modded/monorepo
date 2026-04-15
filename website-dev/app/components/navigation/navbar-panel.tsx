import { type CSSProperties, memo } from "react";
import { motion } from "motion/react";
import { Link } from "@/app/lib/router";
import { ShellNavRow } from "@subway-builder-modded/shared-ui";
import { SiteIcon } from "./site-icon";
import type { SiteSuite, SiteSuiteNavItem } from "@/app/lib/site-navigation";

type NavbarPanelProps = {
  suite: SiteSuite;
  activeItem: SiteSuiteNavItem | null;
  accentColor: string;
  mutedColor: string;
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
  mutedColor,
  rowsVisible,
  prefersReducedMotion,
  onRowClick,
}: NavbarPanelProps) {
  const useRail = suite.items.length > 1;

  return (
    <div
      className="pb-1 pt-0.5"
      style={
        {
          ["--suite-accent" as string]: accentColor,
          ["--suite-muted" as string]: mutedColor,
        } as CSSProperties
      }
    >
      <div className="relative rounded-xl bg-foreground/[0.03] p-2 dark:bg-muted/20">
        {useRail ? (
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-4 top-2 w-[3px] rounded-full bg-[color:color-mix(in_srgb,var(--suite-accent)_55%,transparent)]"
          />
        ) : null}

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
              <li
                key={item.id}
                className={
                  useRail
                    ? "relative border-b border-[color:color-mix(in_srgb,var(--suite-accent)_12%,var(--border))] py-0.5 pl-6 last:border-b-0"
                    : "relative border-b border-[color:color-mix(in_srgb,var(--suite-accent)_12%,var(--border))] py-0.5 last:border-b-0"
                }
              >
                {useRail ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[0.5rem] top-1/2 rounded-full bg-[color:var(--suite-accent)]"
                    style={{
                      width: isActive ? "0.5rem" : "0.375rem",
                      height: isActive ? "0.5rem" : "0.375rem",
                      opacity: isActive ? 0.95 : 0.55,
                      transform: "translateY(-50%)",
                    }}
                  />
                ) : null}

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
    </div>
  );
});
