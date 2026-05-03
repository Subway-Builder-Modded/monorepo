import { useCallback, useMemo } from "react";
import { useLocation, navigate } from "@/lib/router";
import { REGISTRY_TYPES, DEFAULT_REGISTRY_TYPE_ID } from "@/features/registry/registry-type-config";
import {
  DEFAULT_SORT_ID,
  DEFAULT_SORT_DIR,
  DEFAULT_VIEW_MODE,
  REGISTRY_SORT_OPTIONS,
  FALLBACK_SORT_ID,
  isSortSupportedForType,
} from "@/features/registry/lib/types";
import type { RegistrySortId, RegistryViewMode } from "@/features/registry/lib/types";

export type RegistryBrowseParams = {
  typeId: string;
  query: string;
  tags: string[];
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  viewMode: RegistryViewMode;
};

function parseParams(search: string): RegistryBrowseParams {
  const p = new URLSearchParams(search);

  const typeId = (() => {
    const raw = p.get("type") ?? "";
    return REGISTRY_TYPES.some((t) => t.id === raw) ? raw : DEFAULT_REGISTRY_TYPE_ID;
  })();

  const sortId = (() => {
    const raw = p.get("sort") ?? "";
    const opt = REGISTRY_SORT_OPTIONS.find((s) => s.id === raw);
    if (!opt) return DEFAULT_SORT_ID;
    if (!isSortSupportedForType(opt, typeId)) return FALLBACK_SORT_ID;
    return opt.id;
  })();

  const sortDir = ((): "asc" | "desc" => {
    const raw = p.get("dir");
    return raw === "asc" || raw === "desc" ? raw : DEFAULT_SORT_DIR;
  })();

  const viewMode = ((): RegistryViewMode => {
    const raw = p.get("view");
    if (raw === "grid" || raw === "list") return raw;
    return DEFAULT_VIEW_MODE;
  })();

  const query = p.get("q") ?? "";
  const tags = (p.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return { typeId, query, tags, sortId, sortDir, viewMode };
}

function serializeParams(params: RegistryBrowseParams): string {
  const p = new URLSearchParams();
  if (params.typeId !== DEFAULT_REGISTRY_TYPE_ID) p.set("type", params.typeId);
  if (params.query) p.set("q", params.query);
  if (params.tags.length > 0) p.set("tags", params.tags.join(","));
  if (params.sortId !== DEFAULT_SORT_ID) p.set("sort", params.sortId);
  if (params.sortDir !== DEFAULT_SORT_DIR) p.set("dir", params.sortDir);
  if (params.viewMode !== DEFAULT_VIEW_MODE) p.set("view", params.viewMode);
  const str = p.toString();
  return str ? `?${str}` : "";
}

export function useRegistryParams() {
  const { search } = useLocation();
  const params = useMemo(() => parseParams(search), [search]);

  const setParams = useCallback(
    (updates: Partial<RegistryBrowseParams>) => {
      const next = { ...params, ...updates };
      // If type changes, validate sort is still applicable
      if (updates.typeId && updates.typeId !== params.typeId) {
        const sortOpt = REGISTRY_SORT_OPTIONS.find((s) => s.id === next.sortId);
        if (sortOpt && !isSortSupportedForType(sortOpt, updates.typeId)) {
          next.sortId = FALLBACK_SORT_ID;
        }
      }
      navigate(`/registry${serializeParams(next)}`, { preserveScroll: true });
    },
    [params],
  );

  return { params, setParams };
}
