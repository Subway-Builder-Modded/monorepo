import { createContext, useContext, type ReactNode } from "react";
import type { DocsSuiteId } from "@/config/docs";

/**
 * Identity of the doc page currently being rendered. MDX components rendered
 * inside the page (`<Directory />`, etc.) read from this so authors don't have
 * to repeat `suiteId` / `version` / `slug` on every component invocation.
 */
export type DocsRouteContextValue = {
  suiteId: DocsSuiteId;
  version: string | null;
  slug: string;
};

const DocsRouteContext = createContext<DocsRouteContextValue | null>(null);

export function DocsRouteProvider({
  value,
  children,
}: {
  value: DocsRouteContextValue;
  children: ReactNode;
}) {
  return <DocsRouteContext.Provider value={value}>{children}</DocsRouteContext.Provider>;
}

export function useDocsRoute(): DocsRouteContextValue | null {
  return useContext(DocsRouteContext);
}
