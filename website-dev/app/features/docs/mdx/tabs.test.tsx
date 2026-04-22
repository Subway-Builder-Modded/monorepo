import { describe, expect, it, beforeEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabItem } from "@/app/features/docs/mdx/tabs";

describe("Tabs component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders all tab labels", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="Second Tab">
          Content 2
        </TabItem>
      </Tabs>,
    );

    expect(screen.getByText("First Tab")).toBeInTheDocument();
    expect(screen.getByText("Second Tab")).toBeInTheDocument();
  });

  it("shows first tab content by default", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="Second Tab">
          Content 2
        </TabItem>
      </Tabs>,
    );

    expect(screen.getByText("Content 1")).toBeVisible();
    expect(screen.queryByText("Content 2")).not.toBeVisible();
  });

  it("shows default tab content when specified", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="Second Tab" default>
          Content 2
        </TabItem>
      </Tabs>,
    );

    expect(screen.queryByText("Content 1")).not.toBeVisible();
    expect(screen.getByText("Content 2")).toBeVisible();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();

    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="Second Tab">
          Content 2
        </TabItem>
      </Tabs>,
    );

    await user.click(screen.getByText("Second Tab"));

    expect(screen.queryByText("Content 1")).not.toBeVisible();
    expect(screen.getByText("Content 2")).toBeVisible();
  });

  it("uses tablist role for accessibility", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="Second Tab">
          Content 2
        </TabItem>
      </Tabs>,
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });

  it("supports the code variant styling for code block tab groups", () => {
    const { container } = render(
      <Tabs variant="code">
        <TabItem value="tab1" label="Bash" icon="Terminal">
          Content 1
        </TabItem>
        <TabItem value="tab2" label="PowerShell" icon="Shield">
          Content 2
        </TabItem>
      </Tabs>,
    );

    expect(container.firstElementChild?.className).toContain("rounded-xl");
    expect(container.firstElementChild?.className).toContain("bg-card/95");
    expect(screen.getByRole("tab", { name: "Bash" }).className).toContain("rounded-md");
    expect(screen.getByRole("tab", { name: "Bash" }).className).toContain(
      "var(--suite-accent-light)",
    );
    expect(document.querySelector('[role="tab"] svg')).not.toBeNull();
  });
});
