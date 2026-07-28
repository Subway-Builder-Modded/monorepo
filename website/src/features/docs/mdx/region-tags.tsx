import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

import { REGIONS } from "./region-tags-data";

function codeToEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

export function RegionTags() {
  const [activeRegionId, setActiveRegionId] = useState(REGIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const activeRegion = REGIONS.find((r) => r.id === activeRegionId) ?? REGIONS[0];

  const countryIndex = useMemo(
    () => REGIONS.flatMap((r) => r.countries.map((c) => ({ regionId: r.id, country: c }))),
    [],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleCountries = useMemo(() => {
    if (!normalizedSearch) return activeRegion.countries;
    return activeRegion.countries.filter((c) => c.name.toLowerCase().includes(normalizedSearch));
  }, [activeRegion, normalizedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const query = value.trim().toLowerCase();
    if (!query) return;
    const match = countryIndex.find((e) => e.country.name.toLowerCase().includes(query));
    if (match) setActiveRegionId(match.regionId);
  };

  return (
    <div className="my-8 rounded-xl border border-border/50 bg-card/30 p-5 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-2">
          <label
            htmlFor="tagging-region"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Region
          </label>
          <div className="relative">
            <select
              id="tagging-region"
              value={activeRegion.id}
              onChange={(e) => setActiveRegionId(e.target.value)}
              className={cn(
                "h-10 w-full appearance-none rounded-lg border border-border/50 bg-background",
                "px-3 pr-9 text-sm text-foreground outline-none transition-colors",
                "hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60",
              )}
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tagging-country-search"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Country Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="tagging-country-search"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search countries..."
              className={cn(
                "h-10 w-full rounded-lg border border-border/50 bg-background",
                "pl-9 pr-3 text-sm text-foreground outline-none transition-colors",
                "placeholder:text-muted-foreground/80 hover:border-border",
                "focus-visible:ring-2 focus-visible:ring-ring/60",
              )}
            />
          </div>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCountries.map((country) => (
          <li
            key={country.code}
            className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5"
          >
            <span className="shrink-0 text-base" aria-hidden="true">
              {codeToEmoji(country.code)}
            </span>
            <span className="text-sm leading-tight">{country.name}</span>
          </li>
        ))}
      </ul>

      {visibleCountries.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No matching countries found for this region.
        </p>
      )}
    </div>
  );
}
