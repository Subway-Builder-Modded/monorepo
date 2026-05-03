import type { RegistrySearchItem } from "./registry-search-types";
import type { RegistrySortId } from "./types";

const collator = new Intl.Collator("en", { sensitivity: "base" });

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
 */
export function sortRegistryItems(
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
      case "downloads":
        cmp = compareNumbers(a.totalDownloads, b.totalDownloads);
        break;
      case "population":
        cmp = compareNumbers(a.population, b.population);
        break;
      case "name":
        cmp = compareStrings(a.name, b.name);
        break;
      case "author":
        cmp = compareStrings(a.author, b.author);
        break;
      case "cityCode":
        cmp = compareStrings(a.cityCode, b.cityCode);
        break;
      case "country":
        cmp = compareStrings(a.countryName ?? a.countryCode, b.countryName ?? b.countryCode);
        break;
      default:
        cmp = 0;
    }

    return direction === "desc" ? -cmp : cmp;
  });

  return sorted;
}
