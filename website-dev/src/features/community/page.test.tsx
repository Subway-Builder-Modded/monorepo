import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommunityRoute } from "@/features/community/page";
import type { CommunityPageModel } from "@/features/community/community-types";

vi.mock("@/lib/router", () => ({
  useLocation: () => ({ pathname: "/community" }),
  Link: vi.fn(({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

const MODEL: CommunityPageModel = {
  hasServerData: true,
  latestServerDataDate: "2026-04-26",
  latestUserDataDate: "2026-04-23",
  latestTotalUsers: 574,
  latestTotalMessages: 67194,
  latestPublicTotalMessages: 6976,
  latestPrivateTotalMessages: 60218,
  loadState: {
    server: "ready",
    users: "ready",
  },
  periods: {
    "3d": {
      period: "3d",
      fromDate: "2026-04-24",
      throughDate: "2026-04-26",
      points: [
        {
          date: "2026-04-23",
          totalUsers: 564,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-24",
          totalUsers: 573,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-25",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-26",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
      ],
      previousDayDeltaUsers: 0,
      summary: {
        membersNow: 574,
        netGrowth: 10,
        joined: 13,
        left: 3,
        messagesCreated: 0,
        publicMessagesCreated: 0,
        privateMessagesCreated: 0,
        lowActivity: true,
        splitLabel: "lifetime split",
        splitPublic: 6976,
        splitPrivate: 60218,
      },
      contributors: {
        status: "unavailable",
        contributors: [],
        summary:
          "Contributor activity is cached through 2026-04-23. Server growth metrics are current through 2026-04-26.",
        latestUserDataDate: "2026-04-23",
        latestServerDataDate: "2026-04-26",
      },
    },
    "7d": {
      period: "7d",
      fromDate: "2026-04-20",
      throughDate: "2026-04-26",
      points: [
        {
          date: "2026-04-20",
          totalUsers: 560,
          messagesCreated: 14,
          publicMessagesCreated: 4,
          privateMessagesCreated: 10,
        },
        {
          date: "2026-04-21",
          totalUsers: 562,
          messagesCreated: 15,
          publicMessagesCreated: 6,
          privateMessagesCreated: 9,
        },
        {
          date: "2026-04-22",
          totalUsers: 563,
          messagesCreated: 12,
          publicMessagesCreated: 5,
          privateMessagesCreated: 7,
        },
        {
          date: "2026-04-23",
          totalUsers: 564,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-24",
          totalUsers: 573,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-25",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-26",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
      ],
      previousDayDeltaUsers: 0,
      summary: {
        membersNow: 574,
        netGrowth: 16,
        joined: 21,
        left: 5,
        messagesCreated: 41,
        publicMessagesCreated: 15,
        privateMessagesCreated: 26,
        lowActivity: false,
        splitLabel: "period split",
        splitPublic: 15,
        splitPrivate: 26,
      },
      contributors: {
        status: "limited",
        contributors: [
          {
            userName: "Signal",
            totalMessages: 10,
            publicMessages: 2,
            privateMessages: 8,
          },
        ],
        summary:
          "Contributor activity is cached through 2026-04-23. Server growth metrics are current through 2026-04-26.",
        latestUserDataDate: "2026-04-23",
        latestServerDataDate: "2026-04-26",
      },
    },
    "14d": {
      period: "14d",
      fromDate: "2026-04-13",
      throughDate: "2026-04-26",
      points: [
        {
          date: "2026-04-20",
          totalUsers: 560,
          messagesCreated: 14,
          publicMessagesCreated: 4,
          privateMessagesCreated: 10,
        },
        {
          date: "2026-04-21",
          totalUsers: 562,
          messagesCreated: 15,
          publicMessagesCreated: 6,
          privateMessagesCreated: 9,
        },
        {
          date: "2026-04-22",
          totalUsers: 563,
          messagesCreated: 12,
          publicMessagesCreated: 5,
          privateMessagesCreated: 7,
        },
        {
          date: "2026-04-23",
          totalUsers: 564,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-24",
          totalUsers: 573,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-25",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
        {
          date: "2026-04-26",
          totalUsers: 574,
          messagesCreated: 0,
          publicMessagesCreated: 0,
          privateMessagesCreated: 0,
        },
      ],
      previousDayDeltaUsers: 0,
      summary: {
        membersNow: 574,
        netGrowth: 16,
        joined: 21,
        left: 5,
        messagesCreated: 41,
        publicMessagesCreated: 15,
        privateMessagesCreated: 26,
        lowActivity: false,
        splitLabel: "period split",
        splitPublic: 15,
        splitPrivate: 26,
      },
      contributors: {
        status: "limited",
        contributors: [
          {
            userName: "Signal",
            totalMessages: 10,
            publicMessages: 2,
            privateMessages: 8,
          },
        ],
        summary:
          "Contributor activity is cached through 2026-04-23. Server growth metrics are current through 2026-04-26.",
        latestUserDataDate: "2026-04-23",
        latestServerDataDate: "2026-04-26",
      },
    },
  },
  allTime: {
    currentMembers: 574,
    totalMessagesCreated: 41,
    totalJoined: 21,
    totalLeft: 5,
    netGrowth: 16,
    firstDate: "2026-04-20",
    lastDate: "2026-04-26",
  },
  allTimePoints: [
    {
      date: "2026-04-20",
      totalUsers: 560,
      messagesCreated: 14,
      publicMessagesCreated: 4,
      privateMessagesCreated: 10,
    },
    {
      date: "2026-04-21",
      totalUsers: 562,
      messagesCreated: 15,
      publicMessagesCreated: 6,
      privateMessagesCreated: 9,
    },
    {
      date: "2026-04-22",
      totalUsers: 563,
      messagesCreated: 12,
      publicMessagesCreated: 5,
      privateMessagesCreated: 7,
    },
    {
      date: "2026-04-23",
      totalUsers: 564,
      messagesCreated: 0,
      publicMessagesCreated: 0,
      privateMessagesCreated: 0,
    },
    {
      date: "2026-04-24",
      totalUsers: 573,
      messagesCreated: 0,
      publicMessagesCreated: 0,
      privateMessagesCreated: 0,
    },
    {
      date: "2026-04-25",
      totalUsers: 574,
      messagesCreated: 0,
      publicMessagesCreated: 0,
      privateMessagesCreated: 0,
    },
    {
      date: "2026-04-26",
      totalUsers: 574,
      messagesCreated: 0,
      publicMessagesCreated: 0,
      privateMessagesCreated: 0,
    },
  ],
};

vi.mock("@/features/community/community-data", () => ({
  loadCommunityPageModel: vi.fn(async () => MODEL),
}));

describe("CommunityRoute", () => {
  it("renders standardized page identity and join CTA", async () => {
    render(<CommunityRoute />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Community" })).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Join the Subway Builder Modded Discord, follow project activity, and see how the community is growing.",
      ),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /join discord/i }).length).toBeGreaterThan(0);
  });

  it("renders period switcher and core metric labels", async () => {
    render(<CommunityRoute />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "3d" })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: "14d" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "7d" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "All Time" })).toBeInTheDocument();

    expect(screen.getByText("Total member count")).toBeInTheDocument();
    expect(screen.getByText("Members joined")).toBeInTheDocument();
    expect(screen.getByText("Members left")).toBeInTheDocument();
  });

  it("switches visible period-sensitive analytics when period tab changes", async () => {
    const user = userEvent.setup();
    render(<CommunityRoute />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "7d" })).toHaveAttribute("aria-selected", "true");
    });

    expect(screen.getByText("574")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "3d" }));

    expect(screen.getByRole("tab", { name: "3d" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Total member count")).toBeInTheDocument();
    expect(screen.getByText("New Members")).toBeInTheDocument();
  });
});
