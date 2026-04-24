import { createContext, useContext, type ReactNode } from "react";
import type { UpdatesSuiteId } from "@/config/updates";

export type UpdatesRouteContextValue = {
  suiteId: UpdatesSuiteId;
  slug: string;
};

const UpdatesRouteContext = createContext<UpdatesRouteContextValue | null>(null);

export function UpdatesRouteProvider({
  value,
  children,
}: {
  value: UpdatesRouteContextValue;
  children: ReactNode;
}) {
  return <UpdatesRouteContext.Provider value={value}>{children}</UpdatesRouteContext.Provider>;
}

export function useUpdatesRoute(): UpdatesRouteContextValue | null {
  return useContext(UpdatesRouteContext);
}
