import { describe, expect, it } from "vitest";
import {
  buildCommunityPageModel,
  parseDiscordServerCsv,
  parseDiscordUserCsv,
} from "@/features/community/community-data";

const SERVER_CSV = [
  "date,total_users,users_joined,users_left,total_messages,messages_created,messages_deleted,public_total_messages,public_messages_created,public_messages_deleted,private_total_messages,private_messages_created,private_messages_deleted",
  "2026-04-20,560,3,1,66800,14,1,6900,4,0,59900,10,1",
  "2026-04-21,562,2,0,66814,15,1,6905,6,0,59909,9,1",
  "2026-04-22,563,2,1,66829,12,0,6910,5,0,59919,7,0",
  "2026-04-23,564,1,0,66841,0,0,6914,0,0,59927,0,0",
  "2026-04-24,573,10,1,67180,0,0,6960,0,0,60220,0,0",
  "2026-04-25,574,2,1,67190,0,0,6970,0,0,60220,0,0",
  "2026-04-26,574,1,1,67194,0,0,6976,0,0,60218,0,0",
].join("\n");

const USER_CSV = [
  "date,user_id,user_name,total_messages,public_messages,private_messages",
  "2026-04-20,u1,Aster,8,4,4",
  "2026-04-21,u2,Signal,10,2,8",
  "2026-04-22,u1,Aster,6,2,4",
  "2026-04-23,u3,Concourse,5,1,4",
].join("\n");

describe("community-data normalization", () => {
  it("maps snake_case server fields into camelCase typed rows", () => {
    const rows = parseDiscordServerCsv(SERVER_CSV);

    expect(rows[0]).toEqual({
      date: "2026-04-20",
      totalUsers: 560,
      usersJoined: 3,
      usersLeft: 1,
      totalMessages: 66800,
      messagesCreated: 14,
      messagesDeleted: 1,
      publicTotalMessages: 6900,
      publicMessagesCreated: 4,
      publicMessagesDeleted: 0,
      privateTotalMessages: 59900,
      privateMessagesCreated: 10,
      privateMessagesDeleted: 1,
    });
  });

  it("maps user rows and keeps date-sorted output", () => {
    const rows = parseDiscordUserCsv(USER_CSV);

    expect(rows[0].date).toBe("2026-04-20");
    expect(rows[0].userId).toBe("u1");
    expect(rows[0].userName).toBe("Aster");
    expect(rows[0].totalMessages).toBe(8);
  });
});

describe("community-data period summaries", () => {
  it("computes joined, left, net growth and message totals for 3d, 7d, and 14d", () => {
    const model = buildCommunityPageModel(
      parseDiscordServerCsv(SERVER_CSV),
      parseDiscordUserCsv(USER_CSV),
    );

    expect(model.periods).not.toBeNull();
    const threeDay = model.periods?.["3d"];
    const sevenDay = model.periods?.["7d"];
    const fourteenDay = model.periods?.["14d"];

    expect(threeDay?.summary.joined).toBe(13);
    expect(threeDay?.summary.left).toBe(3);
    expect(threeDay?.summary.netGrowth).toBe(10);
    expect(threeDay?.points).toHaveLength(4);
    expect(threeDay?.points[0]?.date).toBe("2026-04-23");

    expect(sevenDay?.summary.joined).toBe(21);
    expect(sevenDay?.summary.left).toBe(5);
    expect(sevenDay?.summary.netGrowth).toBe(16);
    expect(sevenDay?.summary.messagesCreated).toBe(41);

    expect(fourteenDay?.summary.joined).toBe(21);
    expect(fourteenDay?.summary.left).toBe(5);
    expect(fourteenDay?.summary.netGrowth).toBe(16);
    expect(fourteenDay?.summary.messagesCreated).toBe(41);
  });

  it("falls back to lifetime split when period-created split is zero", () => {
    const model = buildCommunityPageModel(
      parseDiscordServerCsv(SERVER_CSV),
      parseDiscordUserCsv(USER_CSV),
    );
    const threeDay = model.periods?.["3d"];

    expect(threeDay?.summary.messagesCreated).toBe(0);
    expect(threeDay?.summary.splitLabel).toBe("lifetime split");
    expect(threeDay?.summary.splitPublic).toBe(6976);
    expect(threeDay?.summary.splitPrivate).toBe(60218);
  });
});

describe("community-data mismatch safety", () => {
  it("marks contributor section as limited when user data lags behind server data", () => {
    const model = buildCommunityPageModel(
      parseDiscordServerCsv(SERVER_CSV),
      parseDiscordUserCsv(USER_CSV),
    );
    const sevenDay = model.periods?.["7d"];

    expect(model.latestServerDataDate).toBe("2026-04-26");
    expect(model.latestUserDataDate).toBe("2026-04-23");
    expect(sevenDay?.contributors.status).toBe("limited");
    expect(sevenDay?.contributors.summary).toContain("cached through 2026-04-23");
    expect(sevenDay?.contributors.summary).toContain("current through 2026-04-26");
  });
});

describe("community-data allTime aggregates", () => {
  it("computes all-time totals from the complete server dataset", () => {
    const model = buildCommunityPageModel(
      parseDiscordServerCsv(SERVER_CSV),
      parseDiscordUserCsv(USER_CSV),
    );

    expect(model.allTime).not.toBeNull();
    expect(model.allTime?.currentMembers).toBe(574);
    expect(model.allTime?.totalJoined).toBe(21);
    expect(model.allTime?.totalLeft).toBe(5);
    expect(model.allTime?.netGrowth).toBe(16);
    expect(model.allTime?.totalMessagesCreated).toBe(41);
    expect(model.allTime?.firstDate).toBe("2026-04-20");
    expect(model.allTime?.lastDate).toBe("2026-04-26");
    expect(model.allTimePoints).toHaveLength(7);
  });
});
