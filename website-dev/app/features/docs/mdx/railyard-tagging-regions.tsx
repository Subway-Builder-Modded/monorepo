import { useState, useMemo } from "react";
import { cn } from "@/app/lib/utils";
import { ChevronDown, Search } from "lucide-react";

type CountryEntry = { name: string; code: string };
type RegionEntry = { id: string; label: string; countries: CountryEntry[] };

const REGIONS: RegionEntry[] = [
  {
    id: "north-america",
    label: "North America",
    countries: [
      { name: "Canada", code: "CA" },
      { name: "United States", code: "US" },
      { name: "Mexico", code: "MX" },
      { name: "Greenland", code: "GL" },
      { name: "Bermuda", code: "BM" },
    ],
  },
  {
    id: "caribbean",
    label: "Caribbean",
    countries: [
      { name: "Antigua and Barbuda", code: "AG" },
      { name: "Bahamas", code: "BS" },
      { name: "Barbados", code: "BB" },
      { name: "Cuba", code: "CU" },
      { name: "Dominica", code: "DM" },
      { name: "Dominican Republic", code: "DO" },
      { name: "Grenada", code: "GD" },
      { name: "Haiti", code: "HT" },
      { name: "Jamaica", code: "JM" },
      { name: "Saint Kitts and Nevis", code: "KN" },
      { name: "Saint Lucia", code: "LC" },
      { name: "Saint Vincent and the Grenadines", code: "VC" },
      { name: "Trinidad and Tobago", code: "TT" },
      { name: "Puerto Rico", code: "PR" },
    ],
  },
  {
    id: "central-america",
    label: "Central America",
    countries: [
      { name: "Belize", code: "BZ" },
      { name: "Costa Rica", code: "CR" },
      { name: "El Salvador", code: "SV" },
      { name: "Guatemala", code: "GT" },
      { name: "Honduras", code: "HN" },
      { name: "Nicaragua", code: "NI" },
      { name: "Panama", code: "PA" },
    ],
  },
  {
    id: "south-america",
    label: "South America",
    countries: [
      { name: "Argentina", code: "AR" },
      { name: "Bolivia", code: "BO" },
      { name: "Brazil", code: "BR" },
      { name: "Chile", code: "CL" },
      { name: "Colombia", code: "CO" },
      { name: "Ecuador", code: "EC" },
      { name: "Guyana", code: "GY" },
      { name: "Paraguay", code: "PY" },
      { name: "Peru", code: "PE" },
      { name: "Suriname", code: "SR" },
      { name: "Uruguay", code: "UY" },
      { name: "Venezuela", code: "VE" },
    ],
  },
  {
    id: "north-africa",
    label: "North Africa",
    countries: [
      { name: "Algeria", code: "DZ" },
      { name: "Egypt", code: "EG" },
      { name: "Libya", code: "LY" },
      { name: "Morocco", code: "MA" },
      { name: "Sudan", code: "SD" },
      { name: "Tunisia", code: "TN" },
    ],
  },
  {
    id: "west-africa",
    label: "West Africa",
    countries: [
      { name: "Benin", code: "BJ" },
      { name: "Ghana", code: "GH" },
      { name: "Guinea", code: "GN" },
      { name: "Ivory Coast", code: "CI" },
      { name: "Nigeria", code: "NG" },
      { name: "Senegal", code: "SN" },
      { name: "Togo", code: "TG" },
    ],
  },
  {
    id: "east-africa",
    label: "East Africa",
    countries: [
      { name: "Ethiopia", code: "ET" },
      { name: "Kenya", code: "KE" },
      { name: "Madagascar", code: "MG" },
      { name: "Mozambique", code: "MZ" },
      { name: "Rwanda", code: "RW" },
      { name: "Tanzania", code: "TZ" },
      { name: "Uganda", code: "UG" },
    ],
  },
  {
    id: "southern-africa",
    label: "Southern Africa",
    countries: [
      { name: "Botswana", code: "BW" },
      { name: "Namibia", code: "NA" },
      { name: "South Africa", code: "ZA" },
    ],
  },
  {
    id: "europe",
    label: "Europe",
    countries: [
      { name: "Austria", code: "AT" },
      { name: "Belgium", code: "BE" },
      { name: "Bulgaria", code: "BG" },
      { name: "Croatia", code: "HR" },
      { name: "Czechia", code: "CZ" },
      { name: "Denmark", code: "DK" },
      { name: "Finland", code: "FI" },
      { name: "France", code: "FR" },
      { name: "Germany", code: "DE" },
      { name: "Greece", code: "GR" },
      { name: "Hungary", code: "HU" },
      { name: "Ireland", code: "IE" },
      { name: "Italy", code: "IT" },
      { name: "Netherlands", code: "NL" },
      { name: "Norway", code: "NO" },
      { name: "Poland", code: "PL" },
      { name: "Portugal", code: "PT" },
      { name: "Romania", code: "RO" },
      { name: "Russia", code: "RU" },
      { name: "Spain", code: "ES" },
      { name: "Sweden", code: "SE" },
      { name: "Switzerland", code: "CH" },
      { name: "Ukraine", code: "UA" },
      { name: "United Kingdom", code: "GB" },
    ],
  },
  {
    id: "middle-east",
    label: "Middle East",
    countries: [
      { name: "Iran", code: "IR" },
      { name: "Iraq", code: "IQ" },
      { name: "Israel", code: "IL" },
      { name: "Jordan", code: "JO" },
      { name: "Saudi Arabia", code: "SA" },
      { name: "Turkey", code: "TR" },
      { name: "United Arab Emirates", code: "AE" },
    ],
  },
  {
    id: "central-asia",
    label: "Central Asia",
    countries: [
      { name: "Kazakhstan", code: "KZ" },
      { name: "Kyrgyzstan", code: "KG" },
      { name: "Tajikistan", code: "TJ" },
      { name: "Turkmenistan", code: "TM" },
      { name: "Uzbekistan", code: "UZ" },
    ],
  },
  {
    id: "south-asia",
    label: "South Asia",
    countries: [
      { name: "Bangladesh", code: "BD" },
      { name: "India", code: "IN" },
      { name: "Nepal", code: "NP" },
      { name: "Pakistan", code: "PK" },
      { name: "Sri Lanka", code: "LK" },
    ],
  },
  {
    id: "east-asia",
    label: "East Asia",
    countries: [
      { name: "China", code: "CN" },
      { name: "Japan", code: "JP" },
      { name: "Mongolia", code: "MN" },
      { name: "South Korea", code: "KR" },
      { name: "Taiwan", code: "TW" },
      { name: "Hong Kong", code: "HK" },
    ],
  },
  {
    id: "southeast-asia",
    label: "Southeast Asia",
    countries: [
      { name: "Cambodia", code: "KH" },
      { name: "Indonesia", code: "ID" },
      { name: "Malaysia", code: "MY" },
      { name: "Philippines", code: "PH" },
      { name: "Singapore", code: "SG" },
      { name: "Thailand", code: "TH" },
      { name: "Vietnam", code: "VN" },
    ],
  },
  {
    id: "oceania",
    label: "Oceania",
    countries: [
      { name: "Australia", code: "AU" },
      { name: "New Zealand", code: "NZ" },
      { name: "Fiji", code: "FJ" },
      { name: "Papua New Guinea", code: "PG" },
    ],
  },
];

function codeToEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

export function RailyardTaggingRegions() {
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
