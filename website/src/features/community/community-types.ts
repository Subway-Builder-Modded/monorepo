export type CommunityTimedPeriod = "3d" | "7d" | "14d";
export type CommunityPeriod = CommunityTimedPeriod | "all";

export type DiscordServerDay = {
  date: string;
  totalUsers: number;
  usersJoined: number;
  usersLeft: number;
  totalMessages: number;
  messagesCreated: number;
  messagesDeleted: number;
  publicTotalMessages: number;
  publicMessagesCreated: number;
  publicMessagesDeleted: number;
  privateTotalMessages: number;
  privateMessagesCreated: number;
  privateMessagesDeleted: number;
};

export type DiscordUserMessageDay = {
  date: string;
  userId: string;
  userName: string;
  totalMessages: number;
  publicMessages: number;
  privateMessages: number;
};

export type CommunitySeriesPoint = {
  date: string;
  totalUsers: number;
  messagesCreated: number;
  publicMessagesCreated: number;
  privateMessagesCreated: number;
};

export type CommunityContributor = {
  userName: string;
  totalMessages: number;
  publicMessages: number;
  privateMessages: number;
};

export type CommunityContributorsState =
  | {
      status: "available";
      contributors: CommunityContributor[];
      summary: string;
    }
  | {
      status: "limited";
      contributors: CommunityContributor[];
      summary: string;
      latestUserDataDate: string;
      latestServerDataDate: string;
    }
  | {
      status: "unavailable";
      contributors: [];
      summary: string;
      latestUserDataDate: string | null;
      latestServerDataDate: string;
    }
  | {
      status: "empty";
      contributors: [];
      summary: string;
    };

export type CommunityPeriodSummary = {
  membersNow: number;
  netGrowth: number;
  joined: number;
  left: number;
  messagesCreated: number;
  publicMessagesCreated: number;
  privateMessagesCreated: number;
  lowActivity: boolean;
  splitLabel: "period split" | "lifetime split";
  splitPublic: number;
  splitPrivate: number;
};

export type CommunityPeriodModel = {
  period: CommunityPeriod;
  fromDate: string;
  throughDate: string;
  points: CommunitySeriesPoint[];
  previousDayDeltaUsers: number | null;
  summary: CommunityPeriodSummary;
  contributors: CommunityContributorsState;
};

export type CommunityAllTimeSummary = {
  currentMembers: number;
  totalMessagesCreated: number;
  totalJoined: number;
  totalLeft: number;
  netGrowth: number;
  firstDate: string;
  lastDate: string;
};

export type CommunityPageModel = {
  hasServerData: boolean;
  latestServerDataDate: string | null;
  latestUserDataDate: string | null;
  latestTotalUsers: number;
  latestTotalMessages: number;
  latestPublicTotalMessages: number;
  latestPrivateTotalMessages: number;
  loadState: {
    server: "ready" | "missing" | "empty" | "malformed";
    users: "ready" | "missing" | "empty" | "malformed";
  };
  periods: Record<CommunityTimedPeriod, CommunityPeriodModel> | null;
  allTime: CommunityAllTimeSummary | null;
  allTimePoints: CommunitySeriesPoint[];
};
