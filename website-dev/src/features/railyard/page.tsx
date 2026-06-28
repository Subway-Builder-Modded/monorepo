import { useEffect, useState } from "react";
import { useLocation } from "@/lib/router";
import { matchRailyardRoute } from "@/features/railyard/lib/routing";
import { RailyardPage } from "@/features/railyard/railyard-page";
import { RailyardAnalyticsPage } from "@/features/railyard/components/railyard-analytics-page";
import { fetchRailyardRegistrySummary } from "@/features/railyard/railyard-registry-summary";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

export function RailyardRoute() {
  const location = useLocation();
  const match = matchRailyardRoute(location.pathname);

  const [summary, setSummary] = useState<RailyardRegistrySummary>({ mapsCount: 0, modsCount: 0 });
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  useEffect(() => {
    setIsSummaryLoading(true);

    void fetchRailyardRegistrySummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setIsSummaryLoading(false));
  }, []);

  if (match.kind !== "page") {
    return null;
  }

  if (match.pageId === "analytics") {
    return <RailyardAnalyticsPage tabId={match.tabId} periodId={match.periodId} />;
  }

  return <RailyardPage summary={summary} isSummaryLoading={isSummaryLoading} />;
}
