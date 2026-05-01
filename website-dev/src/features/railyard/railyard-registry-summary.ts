import type { RailyardRegistrySummary } from "./railyard-types";

type RegistryManifest = {
  is_test?: boolean;
};

type RegistryIndex = {
  maps?: string[];
  mods?: string[];
};

function isRegistryManifest(value: unknown): value is RegistryManifest {
  return typeof value === "object" && value !== null;
}

export function countRegistryManifestRecords(manifestRecords: Record<string, string>): number {
  let total = 0;

  for (const raw of Object.values(manifestRecords)) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isRegistryManifest(parsed)) {
        continue;
      }

      if (parsed.is_test === true) {
        continue;
      }

      total += 1;
    } catch {
      // Ignore malformed manifest data; summary should remain resilient.
    }
  }

  return total;
}

async function fetchManifestCount(kindPath: "maps" | "mods"): Promise<number> {
  const index = await fetch(`/registry/${kindPath}/index.json`).then(
    (response) => response.json() as Promise<RegistryIndex>,
  );
  const ids = kindPath === "maps" ? (index.maps ?? []) : (index.mods ?? []);

  const manifestEntries = await Promise.all(
    ids.map(async (id) => {
      const raw = await fetch(`/registry/${kindPath}/${id}/manifest.json`).then((response) =>
        response.text(),
      );
      return [id, raw] as const;
    }),
  );

  return countRegistryManifestRecords(Object.fromEntries(manifestEntries));
}

export async function fetchRailyardRegistrySummary(): Promise<RailyardRegistrySummary> {
  const [mapsCount, modsCount] = await Promise.all([
    fetchManifestCount("maps"),
    fetchManifestCount("mods"),
  ]);

  return {
    mapsCount,
    modsCount,
  };
}
