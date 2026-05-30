import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getRegistryPageUrl } from "@/features/registry/lib/routing";

export type RegistryBrowseParams = {
  typeId: string;
  query: string;
  tags: string[];
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  viewMode: RegistryViewMode;
  page: number;
  pageSize: number;
};

type PersistedRegistryBrowseState = Omit<RegistryBrowseParams, "typeId">;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const ALLOWED_PAGE_SIZES = new Set([12, 24, 48]);
const REGISTRY_VIEW_MODE_CACHE_KEY = "sbm:registry-view-mode";

function normalizePathname(pathname: string): string {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }
  return pathname;
}

function parseTypeId(pathname: string, search: string): string {
  const normalizedPathname = normalizePathname(pathname);
  const segments = normalizedPathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[0] === "registry") {
    const routeSegment = segments[1] ?? "";
    const directMatch = REGISTRY_TYPES.find((type) => type.routeSegment === routeSegment);
    if (directMatch) {
      return directMatch.id;
    }
  }

  const p = new URLSearchParams(search);
  const raw = p.get("type") ?? "";
  return REGISTRY_TYPES.some((t) => t.id === raw) ? raw : DEFAULT_REGISTRY_TYPE_ID;
}

function parseTags(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeViewMode(raw: unknown): RegistryViewMode {
  if (raw === "compact" || raw === "full" || raw === "list") return raw;
  if (raw === "grid") return "compact";
  return DEFAULT_VIEW_MODE;
}

function normalizeSortId(typeId: string, sortId: RegistrySortId): RegistrySortId {
  const opt = REGISTRY_SORT_OPTIONS.find((s) => s.id === sortId);
  if (!opt) return DEFAULT_SORT_ID;
  if (!isSortSupportedForType(opt, typeId)) return FALLBACK_SORT_ID;
  return opt.id;
}

function readCachedViewMode(): RegistryViewMode {
  try {
    const raw = localStorage.getItem(REGISTRY_VIEW_MODE_CACHE_KEY);
    return normalizeViewMode(raw);
  } catch {
    return DEFAULT_VIEW_MODE;
  }
}

function writeCachedViewMode(viewMode: RegistryViewMode) {
  try {
    localStorage.setItem(REGISTRY_VIEW_MODE_CACHE_KEY, viewMode);
  } catch {
    // ignore persistence failures
  }
}

function parsePage(raw: string | null): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PAGE;
}

function parsePageSize(raw: string | null): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && ALLOWED_PAGE_SIZES.has(value) ? value : DEFAULT_PAGE_SIZE;
}

function serializeBrowseState(state: PersistedRegistryBrowseState): string {
  const p = new URLSearchParams();
  if (state.query.trim()) {
    p.set("q", state.query.trim());
  }
  if (state.tags.length > 0) {
    p.set(
      "tags",
      state.tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(","),
    );
  }
  if (state.sortId !== DEFAULT_SORT_ID) {
    p.set("sort", state.sortId);
  }
  if (state.sortDir !== DEFAULT_SORT_DIR) {
    p.set("dir", state.sortDir);
  }
  if (state.page !== DEFAULT_PAGE) {
    p.set("page", String(state.page));
  }
  if (state.pageSize !== DEFAULT_PAGE_SIZE) {
    p.set("pageSize", String(state.pageSize));
  }

  const search = p.toString();
  return search ? `?${search}` : "";
}

function buildRegistryPageUrl(typeId: string, state: PersistedRegistryBrowseState): string {
  return `${getRegistryPageUrl(typeId)}${serializeBrowseState(state)}`;
}

export function useRegistryParams() {
  const { pathname, search } = useLocation();
  const [cachedViewMode, setCachedViewMode] = useState<RegistryViewMode>(() =>
    readCachedViewMode(),
  );

  useEffect(() => {
    setCachedViewMode(readCachedViewMode());
  }, []);

  const typeId = useMemo(() => parseTypeId(pathname, search), [pathname, search]);
  const persistedState = useMemo<PersistedRegistryBrowseState>(() => {
    const p = new URLSearchParams(search);
    const rawSortId = p.get("sort") ?? "";
    const rawSortDir = p.get("dir") ?? "";
    const sortId = REGISTRY_SORT_OPTIONS.some((opt) => opt.id === rawSortId)
      ? (rawSortId as RegistrySortId)
      : DEFAULT_SORT_ID;
    const sortDir = rawSortDir === "asc" || rawSortDir === "desc" ? rawSortDir : DEFAULT_SORT_DIR;
    const query = p.get("q") ?? "";
    const tags = parseTags(p.get("tags"));
    const viewMode = cachedViewMode;
    const page = parsePage(p.get("page"));
    const pageSize = parsePageSize(p.get("pageSize"));

    return {
      query,
      tags,
      sortId,
      sortDir,
      viewMode,
      page,
      pageSize,
    };
  }, [search, cachedViewMode]);

  const params = useMemo<RegistryBrowseParams>(() => {
    const normalizedSortId = normalizeSortId(typeId, persistedState.sortId);
    return {
      typeId,
      query: persistedState.query,
      tags: persistedState.tags,
      sortId: normalizedSortId,
      sortDir: persistedState.sortDir,
      viewMode: persistedState.viewMode,
      page: persistedState.page,
      pageSize: persistedState.pageSize,
    };
  }, [typeId, persistedState]);

  const setParams = useCallback(
    (updates: Partial<RegistryBrowseParams>) => {
      const nextTypeId = updates.typeId ?? params.typeId;
      const nextPersisted: PersistedRegistryBrowseState = {
        query: updates.query ?? params.query,
        tags: updates.tags ?? params.tags,
        sortId: normalizeSortId(nextTypeId, (updates.sortId ?? params.sortId) as RegistrySortId),
        sortDir: updates.sortDir ?? params.sortDir,
        viewMode: updates.viewMode ?? params.viewMode,
        page: updates.page ?? params.page,
        pageSize: updates.pageSize ?? params.pageSize,
      };

      writeCachedViewMode(nextPersisted.viewMode);
      setCachedViewMode(nextPersisted.viewMode);

      navigate(buildRegistryPageUrl(nextTypeId, nextPersisted), { preserveScroll: true });
    },
    [params],
  );

  return { params, setParams };
}
