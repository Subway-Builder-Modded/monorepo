import type { RegistrySearchItem } from "./registry-search-types";
import type { RegistrySortId } from "./types";

const collator = new Intl.Collator("en", { sensitivity: "base" });

/** Most recently updated first (the "lastUpdated" sort's descending order);
 *  id breaks ties deterministically for consumers that need a stable order. */
export function compareByLastUpdatedDesc(a: RegistrySearchItem, b: RegistrySearchItem): number {
  return b.lastActivityAt - a.lastActivityAt || a.id.localeCompare(b.id);
}

function compareStrings(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return collator.compare(a, b);
}

function compareNumbers(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

/** Tiebreak chain when the primary sort compares equal — independent of the
 *  selected direction: most recently updated first, then name A→Z, then id. */
function compareTiebreak(a: RegistrySearchItem, b: RegistrySearchItem): number {
  return (
    b.lastActivityAt - a.lastActivityAt ||
    collator.compare(a.name, b.name) ||
    a.id.localeCompare(b.id)
  );
}

/** Mulberry32 seeded PRNG for stable random sort.
 *  Returns a value in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let t = seed;
  return function () {
    t += 0x6d2b_79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Sort registry items by the given sort id and direction.
 *  Pass `randomSeed` to get a stable shuffle for the "random" sort.
 *  Deprecated items always sort last, regardless of the selected sort
 *  (including random) — within each partition the selected sort applies.
 */
export function sortRegistryItems(
  items: RegistrySearchItem[],
  sortId: RegistrySortId,
  direction: "asc" | "desc",
  randomSeed: number,
): RegistrySearchItem[] {
  const deprecated = items.filter((item) => item.isDeprecated);
  if (deprecated.length > 0) {
    const active = items.filter((item) => !item.isDeprecated);
    return [
      ...sortItemsBy(active, sortId, direction, randomSeed),
      ...sortItemsBy(deprecated, sortId, direction, randomSeed),
    ];
  }

  return sortItemsBy(items, sortId, direction, randomSeed);
}

function sortItemsBy(
  items: RegistrySearchItem[],
  sortId: RegistrySortId,
  direction: "asc" | "desc",
  randomSeed: number,
): RegistrySearchItem[] {
  if (sortId === "random") {
    return shuffleWithSeed(items, randomSeed);
  }

  const sorted = [...items].sort((a, b) => {
    let cmp = 0;

    switch (sortId) {
      case "lastUpdated":
        cmp = compareNumbers(a.lastActivityAt, b.lastActivityAt);
        break;
      case "firstReleased":
        cmp = compareNumbers(a.publishedAt ?? null, b.publishedAt ?? null);
        break;
      case "downloads":
        cmp = compareNumbers(a.totalDownloads, b.totalDownloads);
        break;
      case "population":
        cmp = compareNumbers(a.population, b.population);
        break;
      case "dataQuality": {
        const qa = a.dataQualityScore ?? null;
        const qb = b.dataQualityScore ?? null;
        // Unscored items sort last in both directions, so return before the
        // direction flip below. Two unscored items fall through with cmp 0 so
        // the tiebreak chain orders them.
        if (qa === null && qb !== null) return 1;
        if (qa !== null && qb === null) return -1;
        cmp = qa !== null && qb !== null ? qa - qb : 0;
        break;
      }
      case "name":
        cmp = compareStrings(a.name, b.name);
        break;
      case "author":
        cmp = compareStrings(a.author, b.author);
        break;
      case "cityCode":
        cmp = compareStrings(b.cityCode, a.cityCode);
        break;
      default:
        cmp = 0;
    }

    const primary = direction === "desc" ? -cmp : cmp;
    return primary || compareTiebreak(a, b);
  });

  return sorted;
}
