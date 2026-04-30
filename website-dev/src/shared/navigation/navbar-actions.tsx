import { Menu, MoonStar, Sun, X } from "lucide-react";
import {
  NavbarActionButton,
  NavbarActionGroup,
  NavbarActionLink,
} from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink } from "@/config/site-navigation";
import type { ThemeMode } from "@/hooks/use-theme-mode";

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
        aria-label="Open Discord"
        href={discordLink?.href ?? "#"}
        target="_blank"
        rel="noreferrer"
      >
        {discordLink?.icon}
      </NavbarActionLink>
      <NavbarActionLink
        aria-label="Open GitHub"
        href={githubLink?.href ?? "#"}
        target="_blank"
        rel="noreferrer"
      >
        {githubLink?.icon}
      </NavbarActionLink>
      <NavbarActionButton
        type="button"
        aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        onClick={onThemeClick}
      >
        {theme === "light" ? (
          <Sun className="size-4.5" aria-hidden="true" />
        ) : (
          <MoonStar className="size-4.5" aria-hidden="true" />
        )}
      </NavbarActionButton>
      <NavbarActionButton
        type="button"
        aria-label={isExpanded ? "Close navigation" : "Open navigation"}
        onClick={onMenuClick}
      >
        {isExpanded ? (
          <X className="size-4.5" aria-hidden="true" />
        ) : (
          <Menu className="size-4.5" aria-hidden="true" />
        )}
      </NavbarActionButton>
    </NavbarActionGroup>
  );
}
