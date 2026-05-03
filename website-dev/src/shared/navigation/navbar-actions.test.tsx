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
    const { container } = render(<NavbarActions {...BASE_PROPS} />);
    const link = container.querySelector('a[href*="discord.gg"]');
    expect(link).toBeInTheDocument();
  });

  it("renders the GitHub link", () => {
    const { container } = render(<NavbarActions {...BASE_PROPS} />);
    const link = container.querySelector('a[href*="github.com"]');
    expect(link).toBeInTheDocument();
  });

  it("renders Discord and GitHub icons", () => {
    render(<NavbarActions {...BASE_PROPS} />);
    expect(screen.getByTestId("discord-icon")).toBeInTheDocument();
    expect(screen.getByTestId("github-icon")).toBeInTheDocument();
  });

  it("shows theme toggle labelled for switching to dark when theme is light", () => {
    render(<NavbarActions {...BASE_PROPS} theme="light" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
  });

  it("shows theme toggle labelled for switching to light when theme is dark", () => {
    render(<NavbarActions {...BASE_PROPS} theme="dark" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeInTheDocument();
  });

  it("calls onThemeClick when the theme button is clicked", () => {
    const onThemeClick = vi.fn();
    render(<NavbarActions {...BASE_PROPS} onThemeClick={onThemeClick} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onThemeClick).toHaveBeenCalledTimes(1);
  });

  it("renders menu button when not expanded", () => {
    render(<NavbarActions {...BASE_PROPS} isExpanded={false} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeInTheDocument();
  });

  it("renders menu button when expanded", () => {
    render(<NavbarActions {...BASE_PROPS} isExpanded={true} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeInTheDocument();
  });

  it("calls onMenuClick when the menu button is clicked", () => {
    const onMenuClick = vi.fn();
    render(<NavbarActions {...BASE_PROPS} onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
