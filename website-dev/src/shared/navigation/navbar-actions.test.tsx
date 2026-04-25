import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavbarActions } from "@/shared/navigation/navbar-actions";

const BASE_PROPS = {
  discordLink: {
    id: "discord" as const,
    title: "Discord",
    href: "https://discord.gg/test",
    icon: <span data-testid="discord-icon" />,
  },
  githubLink: {
    id: "github" as const,
    title: "GitHub",
    href: "https://github.com/test",
    icon: <span data-testid="github-icon" />,
  },
  isExpanded: false,
  theme: "light" as const,
  onThemeClick: vi.fn(),
  onMenuClick: vi.fn(),
};

describe("NavbarActions", () => {
  it("renders the Discord link", () => {
    render(<NavbarActions {...BASE_PROPS} />);
    expect(screen.getByLabelText("Open Discord")).toHaveAttribute(
      "href",
      "https://discord.gg/test",
    );
  });

  it("renders the GitHub link", () => {
    render(<NavbarActions {...BASE_PROPS} />);
    expect(screen.getByLabelText("Open GitHub")).toHaveAttribute("href", "https://github.com/test");
  });

  it("renders Discord and GitHub icons", () => {
    render(<NavbarActions {...BASE_PROPS} />);
    expect(screen.getByTestId("discord-icon")).toBeInTheDocument();
    expect(screen.getByTestId("github-icon")).toBeInTheDocument();
  });

  it("shows theme toggle labelled for switching to dark when theme is light", () => {
    render(<NavbarActions {...BASE_PROPS} theme="light" />);
    expect(screen.getByLabelText("Switch to dark theme")).toBeInTheDocument();
  });

  it("shows theme toggle labelled for switching to light when theme is dark", () => {
    render(<NavbarActions {...BASE_PROPS} theme="dark" />);
    expect(screen.getByLabelText("Switch to light theme")).toBeInTheDocument();
  });

  it("calls onThemeClick when the theme button is clicked", () => {
    const onThemeClick = vi.fn();
    render(<NavbarActions {...BASE_PROPS} onThemeClick={onThemeClick} />);
    fireEvent.click(screen.getByLabelText("Switch to dark theme"));
    expect(onThemeClick).toHaveBeenCalledTimes(1);
  });

  it("shows Open navigation label when not expanded", () => {
    render(<NavbarActions {...BASE_PROPS} isExpanded={false} />);
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
  });

  it("shows Close navigation label when expanded", () => {
    render(<NavbarActions {...BASE_PROPS} isExpanded={true} />);
    expect(screen.getByLabelText("Close navigation")).toBeInTheDocument();
  });

  it("calls onMenuClick when the menu button is clicked", () => {
    const onMenuClick = vi.fn();
    render(<NavbarActions {...BASE_PROPS} onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getByLabelText("Open navigation"));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
