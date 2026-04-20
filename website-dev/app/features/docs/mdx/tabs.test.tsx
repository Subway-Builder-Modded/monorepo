import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
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
        <TabItem value="tab1" label="First Tab">Content 1</TabItem>
        <TabItem value="tab2" label="Second Tab">Content 2</TabItem>
      </Tabs>,
    );

    expect(screen.getByText("First Tab")).toBeInTheDocument();
    expect(screen.getByText("Second Tab")).toBeInTheDocument();
  });

  it("shows first tab content by default", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">Content 1</TabItem>
        <TabItem value="tab2" label="Second Tab">Content 2</TabItem>
      </Tabs>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });

  it("shows default tab content when specified", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">Content 1</TabItem>
        <TabItem value="tab2" label="Second Tab" default>Content 2</TabItem>
      </Tabs>,
    );

    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();

    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">Content 1</TabItem>
        <TabItem value="tab2" label="Second Tab">Content 2</TabItem>
      </Tabs>,
    );

    await user.click(screen.getByText("Second Tab"));

    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("uses tablist role for accessibility", () => {
    render(
      <Tabs>
        <TabItem value="tab1" label="First Tab">Content 1</TabItem>
        <TabItem value="tab2" label="Second Tab">Content 2</TabItem>
      </Tabs>,
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });
});
