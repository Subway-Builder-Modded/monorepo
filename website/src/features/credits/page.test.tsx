import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreditsRoute } from "@/features/credits/page";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/credits" }),
  Link: ({
    to,
    className,
    children,
  }: {
    to: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/credits/lib/content", () => ({
  isExternalHref: (href: string) => /^https?:\/\//i.test(href),
  loadCreditsDirectory: vi.fn(async () => ({
    sections: [
      {
        id: "maintainers",
        title: "Maintainers",
        description: "The maintainers who push Subway Builder Modded development forward.",
        subsections: [
          {
            id: "developer",
            title: "Developer",
            people: [
              {
                key: "a:lead",
                displayName: "Lead Dev",
                tier: "developer",
                source: "maintainers",
                link: "https://example.com/lead",
              },
            ],
          },
        ],
      },
      {
        id: "contributors",
        title: "Contributors",
        description:
          "The community supporters whose donations keep Subway Builder Modded moving forward.",
        subsections: [
          {
            id: "engineer",
            title: "Engineer",
            people: [
              {
                key: "k:fallback",
                displayName: "FallbackUser",
                tier: "engineer",
                source: "supporters",
              },
            ],
          },
        ],
      },
    ],
  })),
}));

describe("CreditsRoute", () => {
  it("renders heading from standardized navigation identity", async () => {
    render(<CreditsRoute />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Credits" })).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "The maintainers and contributors helping Subway Builder Modded move forward.",
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText("Loading contributor credits...")).toBeNull();
    expect(
      screen.queryByText(
        "Contributor credits are currently unavailable. Please try again shortly.",
      ),
    ).toBeNull();
    expect(screen.queryByText("No contributor credits are available yet.")).toBeNull();
  });

  it("renders linked authors entries and non-linked fallback entries with explicit link indicators", async () => {
    render(<CreditsRoute />);

    const linkedName = await screen.findByRole("link", { name: /Lead Dev/i });
    expect(linkedName).toHaveAttribute("href", "https://example.com/lead");
    expect(linkedName.querySelector(".lucide-external-link")).toBeInTheDocument();

    const fallbackName = await screen.findByText("FallbackUser");
    expect(fallbackName.closest("a")).toBeNull();
    const fallbackCard = fallbackName.closest("div");
    expect(fallbackCard).toBeTruthy();
    expect((fallbackCard as HTMLElement).querySelector(".lucide-external-link")).toBeNull();
  });

  it("renders main sections with subsection order and icon accents", async () => {
    render(<CreditsRoute />);

    await screen.findByTestId("credits-section-maintainers");

    const sectionOrder = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent?.trim());
    expect(sectionOrder).toEqual(["Maintainers", "Contributors"]);

    const maintainers = screen.getByTestId("credits-section-maintainers");
    const maintainersSubsections = within(maintainers)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent?.trim());
    expect(maintainersSubsections).toEqual(["Developer"]);

    expect(screen.getByTestId("credits-subsection-icon-developer")).toBeInTheDocument();
    expect(screen.getByTestId("credits-subsection-icon-engineer")).toBeInTheDocument();
  });
});
