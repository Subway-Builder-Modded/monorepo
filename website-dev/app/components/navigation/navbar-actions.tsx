import { Menu, MoonStar, Sun, X } from "lucide-react";
import {
  NavbarActionButton,
  NavbarActionGroup,
  NavbarActionLink,
} from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink } from "@/app/config/site-navigation";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

type NavbarActionsProps = {
  discordLink?: SiteCommunityLink;
  githubLink?: SiteCommunityLink;
  isExpanded: boolean;
  theme: ThemeMode;
  onThemeClick: () => void;
  onMenuClick: () => void;
};

export function NavbarActions({
  discordLink,
  githubLink,
  isExpanded,
  theme,
  onThemeClick,
  onMenuClick,
}: NavbarActionsProps) {
  return (
    <NavbarActionGroup>
      <NavbarActionLink
        href={discordLink?.href ?? "#"}
        target="_blank"
        rel="noreferrer"
        aria-label="Open Discord"
      >
        {discordLink?.icon}
      </NavbarActionLink>
      <NavbarActionLink
        href={githubLink?.href ?? "#"}
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub"
      >
        {githubLink?.icon}
      </NavbarActionLink>
      <NavbarActionButton
        type="button"
        onClick={onThemeClick}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      >
        {theme === "light" ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <MoonStar className="size-4" aria-hidden="true" />
        )}
      </NavbarActionButton>
      <NavbarActionButton
        type="button"
        aria-label={isExpanded ? "Close navigation" : "Open navigation"}
        onClick={onMenuClick}
      >
        {isExpanded ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <Menu className="size-4" aria-hidden="true" />
        )}
      </NavbarActionButton>
    </NavbarActionGroup>
  );
}
