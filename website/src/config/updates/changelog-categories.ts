import { Plus, TrendingUp, Bug, Info, type LucideIcon } from "lucide-react";

export type ChangelogCategoryConfig = {
  title: string;
  icon: LucideIcon;
  color: {
    light: string;
    dark: string;
  };
};

export type ChangelogCategoriesConfig = Record<string, ChangelogCategoryConfig>;

export const CHANGELOG_CATEGORIES: ChangelogCategoriesConfig = {
  features: {
    title: "Features",
    icon: Plus,
    color: { light: "#16a34a", dark: "#4ade80" },
  },
  improvements: {
    title: "Improvements",
    icon: TrendingUp,
    color: { light: "#d97706", dark: "#fbbf24" },
  },
  bugfixes: {
    title: "Bugfixes",
    icon: Bug,
    color: { light: "#dc2626", dark: "#f87171" },
  },
  notes: {
    title: "Other Notes",
    icon: Info,
    color: { light: "#0284c7", dark: "#38bdf8" },
  },
};
