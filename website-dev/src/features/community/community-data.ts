import type {
  CommunityContributor,
  CommunityPageModel,
  CommunityTimedPeriod,
  CommunityPeriodModel,
  CommunitySeriesPoint,
  DiscordServerDay,
  DiscordUserMessageDay,
} from "@/features/community/community-types";

const SERVER_CSV_URL = "/community/discord_server_by_day.csv";
const USER_CSV_URL = "/community/discord_user_message_by_day.csv";

const PERIOD_DAYS: Record<CommunityTimedPeriod, number> = {
  "3d": 3,
  "7d": 7,
  "14d": 14,
};

type DatasetState = "ready" | "missing" | "empty" | "malformed";

type CsvLoadResult = {
  state: DatasetState;
  text: string;
};

function parseIntSafe(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { header: [], rows: [] };
  }

  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { header, rows };
}

function rowsToRecords(header: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = row[index] ?? "";
    });
    return record;
  });
}

export function parseDiscordServerCsv(csvText: string): DiscordServerDay[] {
  const { header, rows } = parseCsv(csvText);
  if (header.length === 0) return [];

  return rowsToRecords(header, rows)
    .map((row): DiscordServerDay | null => {
      const date = normalizeDate(row.date);
      if (!date) return null;

      return {
        date,
        totalUsers: parseIntSafe(row.total_users),
        usersJoined: parseIntSafe(row.users_joined),
        usersLeft: parseIntSafe(row.users_left),
        totalMessages: parseIntSafe(row.total_messages),
        messagesCreated: parseIntSafe(row.messages_created),
        messagesDeleted: parseIntSafe(row.messages_deleted),
        publicTotalMessages: parseIntSafe(row.public_total_messages),
        publicMessagesCreated: parseIntSafe(row.public_messages_created),
        publicMessagesDeleted: parseIntSafe(row.public_messages_deleted),
        privateTotalMessages: parseIntSafe(row.private_total_messages),
        privateMessagesCreated: parseIntSafe(row.private_messages_created),
        privateMessagesDeleted: parseIntSafe(row.private_messages_deleted),
      };
    })
    .filter((row): row is DiscordServerDay => row !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function parseDiscordUserCsv(csvText: string): DiscordUserMessageDay[] {
  const { header, rows } = parseCsv(csvText);
  if (header.length === 0) return [];

  return rowsToRecords(header, rows)
    .map((row): DiscordUserMessageDay | null => {
      const date = normalizeDate(row.date);
      if (!date) return null;

      const userId = (row.user_id ?? "").trim();
      const userName = (row.user_name ?? "").trim() || "Unknown member";
      if (!userId) return null;

      return {
        date,
        userId,
        userName,
        totalMessages: parseIntSafe(row.total_messages),
        publicMessages: parseIntSafe(row.public_messages),
        privateMessages: parseIntSafe(row.private_messages),
      };
    })
    .filter((row): row is DiscordUserMessageDay => row !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}

async function loadCsvText(
  url: string,
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): Promise<CsvLoadResult> {
  try {
    const response = await fetcher(url, { cache: "no-store" });

    if (!response.ok) {
      if (response.status === 404) {
        return { state: "missing", text: "" };
      }

      return { state: "malformed", text: "" };
    }

    const text = await response.text();
    if (text.trim().length === 0) {
      return { state: "empty", text: "" };
    }

    return { state: "ready", text };
  } catch {
    return { state: "missing", text: "" };
  }
}

function sumBy<T>(rows: T[], getter: (row: T) => number): number {
  return rows.reduce((total, row) => total + getter(row), 0);
}

function getWindowDates(serverRows: DiscordServerDay[], period: CommunityTimedPeriod) {
  const latest = serverRows[serverRows.length - 1];
  const latestDate = new Date(`${latest.date}T00:00:00Z`);
  const windowDays = PERIOD_DAYS[period] - 1;
  const fromDate = new Date(latestDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - windowDays);

  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    throughDate: latest.date,
  };
}

function getGraphFromDate(fromDate: string): string {
  const from = new Date(`${fromDate}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  return from.toISOString().slice(0, 10);
}

function toPeriodPoints(rows: DiscordServerDay[]): CommunitySeriesPoint[] {
  return rows.map((row) => ({
    date: row.date,
    totalUsers: row.totalUsers,
    messagesCreated: row.messagesCreated,
    publicMessagesCreated: row.publicMessagesCreated,
    privateMessagesCreated: row.privateMessagesCreated,
  }));
}

function buildContributorsState(
  userRows: DiscordUserMessageDay[],
  fromDate: string,
  throughDate: string,
  latestServerDate: string,
  latestUserDate: string | null,
): CommunityPeriodModel["contributors"] {
  if (!latestUserDate || userRows.length === 0) {
    return {
      status: "unavailable",
      contributors: [],
      summary:
        "Contributor activity has not been cached yet. Server growth analytics are still available.",
      latestUserDataDate: latestUserDate,
      latestServerDataDate: latestServerDate,
    };
  }

  const periodRows = userRows.filter((row) => row.date >= fromDate && row.date <= throughDate);

  const contributorByUser = new Map<string, CommunityContributor & { userId: string }>();

  for (const row of periodRows) {
    const existing = contributorByUser.get(row.userId);
    if (!existing) {
      contributorByUser.set(row.userId, {
        userId: row.userId,
        userName: row.userName,
        totalMessages: row.totalMessages,
        publicMessages: row.publicMessages,
        privateMessages: row.privateMessages,
      });
      continue;
    }

    existing.userName = row.userName || existing.userName;
    existing.totalMessages += row.totalMessages;
    existing.publicMessages += row.publicMessages;
    existing.privateMessages += row.privateMessages;
  }

  const contributors = Array.from(contributorByUser.values())
    .sort((left, right) => {
      if (right.totalMessages !== left.totalMessages) {
        return right.totalMessages - left.totalMessages;
      }
      return left.userName.localeCompare(right.userName);
    })
    .slice(0, 8)
    .map((contributor) => ({
      userName: contributor.userName,
      totalMessages: contributor.totalMessages,
      publicMessages: contributor.publicMessages,
      privateMessages: contributor.privateMessages,
    }));

  const mismatch = latestUserDate < latestServerDate;
  const overlapSummary = `Contributor activity is cached through ${latestUserDate}. Server growth metrics are current through ${latestServerDate}.`;

  if (contributors.length === 0) {
    if (mismatch) {
      return {
        status: "unavailable",
        contributors: [],
        summary: overlapSummary,
        latestUserDataDate: latestUserDate,
        latestServerDataDate: latestServerDate,
      };
    }

    return {
      status: "empty",
      contributors: [],
      summary: "No contributor message activity was recorded for this cached period.",
    };
  }

  if (mismatch) {
    return {
      status: "limited",
      contributors,
      summary: overlapSummary,
      latestUserDataDate: latestUserDate,
      latestServerDataDate: latestServerDate,
    };
  }

  return {
    status: "available",
    contributors,
    summary: `Top contributor activity for ${fromDate} through ${throughDate}.`,
  };
}

function buildAllTimeSummary(serverRows: DiscordServerDay[]) {
  if (serverRows.length === 0) return null;

  const latest = serverRows[serverRows.length - 1];
  const first = serverRows[0];
  const totalJoined = sumBy(serverRows, (row) => row.usersJoined);
  const totalLeft = sumBy(serverRows, (row) => row.usersLeft);

  return {
    currentMembers: latest.totalUsers,
    totalMessagesCreated: sumBy(serverRows, (row) => row.messagesCreated),
    totalJoined,
    totalLeft,
    netGrowth: totalJoined - totalLeft,
    firstDate: first.date,
    lastDate: latest.date,
  };
}

function buildPeriodModel(
  period: CommunityTimedPeriod,
  serverRows: DiscordServerDay[],
  userRows: DiscordUserMessageDay[],
): CommunityPeriodModel {
  const { fromDate, throughDate } = getWindowDates(serverRows, period);
  const graphFromDate = getGraphFromDate(fromDate);
  const latestServer = serverRows[serverRows.length - 1];
  const latestUser = userRows.length > 0 ? userRows[userRows.length - 1] : null;

  const periodServerRows = serverRows.filter(
    (row) => row.date >= fromDate && row.date <= throughDate,
  );
  const graphServerRows = serverRows.filter(
    (row) => row.date >= graphFromDate && row.date <= throughDate,
  );
  const joined = sumBy(periodServerRows, (row) => row.usersJoined);
  const left = sumBy(periodServerRows, (row) => row.usersLeft);

  const netGrowth = joined - left;

  const messagesCreated = sumBy(periodServerRows, (row) => row.messagesCreated);
  const publicMessagesCreated = sumBy(periodServerRows, (row) => row.publicMessagesCreated);
  const privateMessagesCreated = sumBy(periodServerRows, (row) => row.privateMessagesCreated);

  const createdSplitTotal = publicMessagesCreated + privateMessagesCreated;
  const useLifetimeSplit = createdSplitTotal === 0;

  const splitPublic = useLifetimeSplit ? latestServer.publicTotalMessages : publicMessagesCreated;
  const splitPrivate = useLifetimeSplit
    ? latestServer.privateTotalMessages
    : privateMessagesCreated;

  const latestIndex = serverRows.findIndex((row) => row.date === latestServer.date);
  const previousDay = latestIndex > 0 ? serverRows[latestIndex - 1] : null;

  return {
    period,
    fromDate,
    throughDate,
    points: toPeriodPoints(graphServerRows),
    previousDayDeltaUsers: previousDay ? latestServer.totalUsers - previousDay.totalUsers : null,
    summary: {
      membersNow: latestServer.totalUsers,
      netGrowth,
      joined,
      left,
      messagesCreated,
      publicMessagesCreated,
      privateMessagesCreated,
      lowActivity: messagesCreated === 0,
      splitLabel: useLifetimeSplit ? "lifetime split" : "period split",
      splitPublic,
      splitPrivate,
    },
    contributors: buildContributorsState(
      userRows,
      fromDate,
      throughDate,
      latestServer.date,
      latestUser?.date ?? null,
    ),
  };
}

function toState(value: DatasetState, rowsLength: number): DatasetState {
  if (value !== "ready") {
    return value;
  }

  return rowsLength > 0 ? "ready" : "empty";
}

export function buildCommunityPageModel(
  serverRows: DiscordServerDay[],
  userRows: DiscordUserMessageDay[],
  serverLoadState: DatasetState = "ready",
  userLoadState: DatasetState = "ready",
): CommunityPageModel {
  const latestServer = serverRows.length > 0 ? serverRows[serverRows.length - 1] : null;
  const latestUser = userRows.length > 0 ? userRows[userRows.length - 1] : null;

  if (!latestServer) {
    return {
      hasServerData: false,
      latestServerDataDate: null,
      latestUserDataDate: latestUser?.date ?? null,
      latestTotalUsers: 0,
      latestTotalMessages: 0,
      latestPublicTotalMessages: 0,
      latestPrivateTotalMessages: 0,
      loadState: {
        server: toState(serverLoadState, serverRows.length),
        users: toState(userLoadState, userRows.length),
      },
      periods: null,
      allTime: null,
      allTimePoints: [],
    };
  }

  return {
    hasServerData: true,
    latestServerDataDate: latestServer.date,
    latestUserDataDate: latestUser?.date ?? null,
    latestTotalUsers: latestServer.totalUsers,
    latestTotalMessages: latestServer.totalMessages,
    latestPublicTotalMessages: latestServer.publicTotalMessages,
    latestPrivateTotalMessages: latestServer.privateTotalMessages,
    loadState: {
      server: toState(serverLoadState, serverRows.length),
      users: toState(userLoadState, userRows.length),
    },
    periods: {
      "3d": buildPeriodModel("3d", serverRows, userRows),
      "7d": buildPeriodModel("7d", serverRows, userRows),
      "14d": buildPeriodModel("14d", serverRows, userRows),
    },
    allTime: buildAllTimeSummary(serverRows),
    allTimePoints: toPeriodPoints(serverRows),
  };
}

export async function loadCommunityPageModel(
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = fetch,
): Promise<CommunityPageModel> {
  const [serverResult, userResult] = await Promise.all([
    loadCsvText(SERVER_CSV_URL, fetcher),
    loadCsvText(USER_CSV_URL, fetcher),
  ]);

  const serverRows =
    serverResult.state === "ready"
      ? parseDiscordServerCsv(serverResult.text)
      : ([] as DiscordServerDay[]);
  const userRows =
    userResult.state === "ready"
      ? parseDiscordUserCsv(userResult.text)
      : ([] as DiscordUserMessageDay[]);

  const normalizedServerState =
    serverResult.state === "ready" && serverRows.length === 0 ? "malformed" : serverResult.state;
  const normalizedUserState =
    userResult.state === "ready" && userRows.length === 0 ? "malformed" : userResult.state;

  return buildCommunityPageModel(serverRows, userRows, normalizedServerState, normalizedUserState);
}
