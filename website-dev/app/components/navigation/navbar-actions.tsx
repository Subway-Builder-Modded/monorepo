import { House, Menu, MoonStar, Sun, X } from "lucide-react";
import {
  NAVBAR_ACTION_CLASS,
  NavbarActionButton,
  NavbarActionGroup,
  NavbarActionLink,
} from "@subway-builder-modded/shared-ui";
import type { SiteCommunityLink } from "@/app/config/site-navigation";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { Link } from "@/app/lib/router";

type NavbarActionsProps = {
  discordLink?: SiteCommunityLink;
  githubLink?: SiteCommunityLink;
  isExpanded: boolean;
  theme: ThemeMode;
  onThemeClick: () => void;
  onMenuClick: () => void;
};

const collapsedActionOffset = { transform: "translateY(-0.5px)" };

export function NavbarActions({
  discordLink,
  githubLink,
  isExpanded,
  theme,
  onThemeClick,
  onMenuClick,
}: NavbarActionsProps) {
  return (
    <NavbarActionGroup style={isExpanded ? undefined : collapsedActionOffset}>
      <Link to="/" aria-label="Go to home" className={NAVBAR_ACTION_CLASS}>
        <House className="size-4" aria-hidden="true" />
      </Link>
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
