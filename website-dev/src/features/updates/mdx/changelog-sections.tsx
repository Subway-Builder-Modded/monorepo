import { type ReactNode, createContext, type CSSProperties } from "react";
import { SectionSeparator } from "@subway-builder-modded/shared-ui";
import { cn } from "@/lib/utils";
import { CHANGELOG_CATEGORIES } from "@/config/updates";
import type { LucideIcon } from "lucide-react";

export type ChangelogBulletContextValue = {
  Icon: LucideIcon;
  iconClass: string;
};

export const ChangelogBulletContext = createContext<ChangelogBulletContextValue | null>(null);

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

export function ChangelogSection({ type, children }: { type: string; children?: ReactNode }) {
  const categoryKey = normalizeCategoryKey(type);
  if (!categoryKey) {
    throw new Error("[updates-changelog] ChangelogSection requires a non-empty category type.");
  }

  const category = CHANGELOG_CATEGORIES[categoryKey];
  if (!category) {
    const knownCategories = Object.keys(CHANGELOG_CATEGORIES).join(", ");
    throw new Error(
      `[updates-changelog] Unknown changelog category "${categoryKey}". Known categories: ${knownCategories || "(none)"}.`,
    );
  }

  const { title, icon: Icon, color } = category;
  const style = {
    "--changelog-light": color.light,
    "--changelog-dark": color.dark,
  } as CSSProperties;

  return (
    <ChangelogBulletContext.Provider
      value={{
        Icon,
        iconClass: "text-[var(--changelog-light)] dark:text-[var(--changelog-dark)]",
      }}
    >
      <div className="my-5" style={style}>
        <SectionSeparator label={title} icon={Icon} className="mb-2" />
        <div
          className={cn(
            "rounded-lg border px-3 pb-2.5 pt-2",
            "border-[color-mix(in_srgb,var(--changelog-light)_28%,transparent)] bg-[color-mix(in_srgb,var(--changelog-light)_8%,transparent)]",
            "dark:border-[color-mix(in_srgb,var(--changelog-dark)_24%,transparent)] dark:bg-[color-mix(in_srgb,var(--changelog-dark)_10%,transparent)]",
          )}
        >
          {children}
        </div>
      </div>
    </ChangelogBulletContext.Provider>
  );
}
