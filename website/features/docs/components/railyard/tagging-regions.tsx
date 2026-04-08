'use client';

import * as React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { getCountryFlagIcon } from '@/lib/railyard/flags';

type CountryEntry = {
  name: string;
  code: string;
};

type RegionEntry = {
  id: string;
  label: string;
  countries: CountryEntry[];
};

const REGIONS: RegionEntry[] = [
  {
    id: 'north-america',
    label: 'North America',
    countries: [
      { name: 'Canada', code: 'CA' },
      { name: 'United States', code: 'US' },
      { name: 'Mexico', code: 'MX' },
      { name: 'Greenland', code: 'GL' },
      { name: 'Bermuda', code: 'BM' },
      { name: 'Saint Pierre and Miquelon', code: 'PM' },
    ],
  },
  {
    id: 'caribbean',
    label: 'Caribbean',
    countries: [
      { name: 'Antigua and Barbuda', code: 'AG' },
      { name: 'Bahamas', code: 'BS' },
      { name: 'Barbados', code: 'BB' },
      { name: 'Cuba', code: 'CU' },
      { name: 'Dominica', code: 'DM' },
      { name: 'Dominican Republic', code: 'DO' },
      { name: 'Grenada', code: 'GD' },
      { name: 'Haiti', code: 'HT' },
      { name: 'Jamaica', code: 'JM' },
      { name: 'Saint Kitts and Nevis', code: 'KN' },
      { name: 'Saint Lucia', code: 'LC' },
      { name: 'Saint Vincent and the Grenadines', code: 'VC' },
      { name: 'Trinidad and Tobago', code: 'TT' },
      { name: 'Puerto Rico', code: 'PR' },
      { name: 'Aruba', code: 'AW' },
      { name: 'Curaçao', code: 'CW' },
      { name: 'Sint Maarten', code: 'SX' },
      { name: 'British Virgin Islands', code: 'VG' },
      { name: 'U.S. Virgin Islands', code: 'VI' },
      { name: 'Cayman Islands', code: 'KY' },
      { name: 'Turks and Caicos Islands', code: 'TC' },
      { name: 'Guadeloupe', code: 'GP' },
      { name: 'Martinique', code: 'MQ' },
      { name: 'Saint Barthelemy', code: 'BL' },
      { name: 'Saint Martin', code: 'MF' },
    ],
  },
  {
    id: 'central-america',
    label: 'Central America',
    countries: [
      { name: 'Belize', code: 'BZ' },
      { name: 'Costa Rica', code: 'CR' },
      { name: 'El Salvador', code: 'SV' },
      { name: 'Guatemala', code: 'GT' },
      { name: 'Honduras', code: 'HN' },
      { name: 'Nicaragua', code: 'NI' },
      { name: 'Panama', code: 'PA' },
    ],
  },
  {
    id: 'south-america',
    label: 'South America',
    countries: [
      { name: 'Argentina', code: 'AR' },
      { name: 'Bolivia', code: 'BO' },
      { name: 'Brazil', code: 'BR' },
      { name: 'Chile', code: 'CL' },
      { name: 'Colombia', code: 'CO' },
      { name: 'Ecuador', code: 'EC' },
      { name: 'Guyana', code: 'GY' },
      { name: 'Paraguay', code: 'PY' },
      { name: 'Peru', code: 'PE' },
      { name: 'Suriname', code: 'SR' },
      { name: 'Uruguay', code: 'UY' },
      { name: 'Venezuela', code: 'VE' },
      { name: 'French Guiana', code: 'GF' },
    ],
  },
  {
    id: 'north-africa',
    label: 'North Africa',
    countries: [
      { name: 'Algeria', code: 'DZ' },
      { name: 'Egypt', code: 'EG' },
      { name: 'Libya', code: 'LY' },
      { name: 'Morocco', code: 'MA' },
      { name: 'Sudan', code: 'SD' },
      { name: 'Tunisia', code: 'TN' },
      { name: 'Western Sahara', code: 'EH' },
    ],
  },
  {
    id: 'west-africa',
    label: 'West Africa',
    countries: [
      { name: 'Benin', code: 'BJ' },
      { name: 'Burkina Faso', code: 'BF' },
      { name: 'Cabo Verde', code: 'CV' },
      { name: 'Gambia', code: 'GM' },
      { name: 'Ghana', code: 'GH' },
      { name: 'Guinea', code: 'GN' },
      { name: 'Guinea-Bissau', code: 'GW' },
      { name: 'Ivory Coast', code: 'CI' },
      { name: 'Liberia', code: 'LR' },
      { name: 'Mali', code: 'ML' },
      { name: 'Mauritania', code: 'MR' },
      { name: 'Niger', code: 'NE' },
      { name: 'Nigeria', code: 'NG' },
      { name: 'Senegal', code: 'SN' },
      { name: 'Sierra Leone', code: 'SL' },
      { name: 'Togo', code: 'TG' },
      { name: 'Saint Helena', code: 'SH' },
    ],
  },
  {
    id: 'east-africa',
    label: 'East Africa',
    countries: [
      { name: 'Burundi', code: 'BI' },
      { name: 'Comoros', code: 'KM' },
      { name: 'Djibouti', code: 'DJ' },
      { name: 'Eritrea', code: 'ER' },
      { name: 'Ethiopia', code: 'ET' },
      { name: 'Kenya', code: 'KE' },
      { name: 'Madagascar', code: 'MG' },
      { name: 'Malawi', code: 'MW' },
      { name: 'Mauritius', code: 'MU' },
      { name: 'Mozambique', code: 'MZ' },
      { name: 'Rwanda', code: 'RW' },
      { name: 'Seychelles', code: 'SC' },
      { name: 'Somalia', code: 'SO' },
      { name: 'South Sudan', code: 'SS' },
      { name: 'Tanzania', code: 'TZ' },
      { name: 'Uganda', code: 'UG' },
      { name: 'Zambia', code: 'ZM' },
      { name: 'Zimbabwe', code: 'ZW' },
      { name: 'Reunion', code: 'RE' },
      { name: 'Mayotte', code: 'YT' },
    ],
  },
  {
    id: 'southern-africa',
    label: 'Southern Africa',
    countries: [
      { name: 'Botswana', code: 'BW' },
      { name: 'Eswatini', code: 'SZ' },
      { name: 'Lesotho', code: 'LS' },
      { name: 'Namibia', code: 'NA' },
      { name: 'South Africa', code: 'ZA' },
    ],
  },
  {
    id: 'europe',
    label: 'Europe',
    countries: [
      { name: 'Albania', code: 'AL' },
      { name: 'Andorra', code: 'AD' },
      { name: 'Austria', code: 'AT' },
      { name: 'Belarus', code: 'BY' },
      { name: 'Belgium', code: 'BE' },
      { name: 'Bosnia and Herzegovina', code: 'BA' },
      { name: 'Bulgaria', code: 'BG' },
      { name: 'Croatia', code: 'HR' },
      { name: 'Cyprus', code: 'CY' },
      { name: 'Czechia', code: 'CZ' },
      { name: 'Denmark', code: 'DK' },
      { name: 'Estonia', code: 'EE' },
      { name: 'Finland', code: 'FI' },
      { name: 'France', code: 'FR' },
      { name: 'Germany', code: 'DE' },
      { name: 'Gibraltar', code: 'GI' },
      { name: 'Greece', code: 'GR' },
      { name: 'Hungary', code: 'HU' },
      { name: 'Iceland', code: 'IS' },
      { name: 'Ireland', code: 'IE' },
      { name: 'Isle of Man', code: 'IM' },
      { name: 'Italy', code: 'IT' },
      { name: 'Kosovo', code: 'XK' },
      { name: 'Latvia', code: 'LV' },
      { name: 'Liechtenstein', code: 'LI' },
      { name: 'Lithuania', code: 'LT' },
      { name: 'Luxembourg', code: 'LU' },
      { name: 'Malta', code: 'MT' },
      { name: 'Moldova', code: 'MD' },
      { name: 'Monaco', code: 'MC' },
      { name: 'Montenegro', code: 'ME' },
      { name: 'Netherlands', code: 'NL' },
      { name: 'North Macedonia', code: 'MK' },
      { name: 'Norway', code: 'NO' },
      { name: 'Poland', code: 'PL' },
      { name: 'Portugal', code: 'PT' },
      { name: 'Romania', code: 'RO' },
      { name: 'Russia', code: 'RU' },
      { name: 'San Marino', code: 'SM' },
      { name: 'Serbia', code: 'RS' },
      { name: 'Slovakia', code: 'SK' },
      { name: 'Slovenia', code: 'SI' },
      { name: 'Spain', code: 'ES' },
      { name: 'Svalbard and Jan Mayen', code: 'SJ' },
      { name: 'Sweden', code: 'SE' },
      { name: 'Switzerland', code: 'CH' },
      { name: 'Ukraine', code: 'UA' },
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Vatican City', code: 'VA' },
    ],
  },
  {
    id: 'middle-east',
    label: 'Middle East',
    countries: [
      { name: 'Bahrain', code: 'BH' },
      { name: 'Iran', code: 'IR' },
      { name: 'Iraq', code: 'IQ' },
      { name: 'Israel', code: 'IL' },
      { name: 'Jordan', code: 'JO' },
      { name: 'Kuwait', code: 'KW' },
      { name: 'Lebanon', code: 'LB' },
      { name: 'Oman', code: 'OM' },
      { name: 'Palestine', code: 'PS' },
      { name: 'Qatar', code: 'QA' },
      { name: 'Saudi Arabia', code: 'SA' },
      { name: 'Syria', code: 'SY' },
      { name: 'Turkey', code: 'TR' },
      { name: 'United Arab Emirates', code: 'AE' },
      { name: 'Yemen', code: 'YE' },
    ],
  },
  {
    id: 'central-asia',
    label: 'Central Asia',
    countries: [
      { name: 'Kazakhstan', code: 'KZ' },
      { name: 'Kyrgyzstan', code: 'KG' },
      { name: 'Tajikistan', code: 'TJ' },
      { name: 'Turkmenistan', code: 'TM' },
      { name: 'Uzbekistan', code: 'UZ' },
    ],
  },
  {
    id: 'south-asia',
    label: 'South Asia',
    countries: [
      { name: 'Afghanistan', code: 'AF' },
      { name: 'Bangladesh', code: 'BD' },
      { name: 'Bhutan', code: 'BT' },
      { name: 'India', code: 'IN' },
      { name: 'Maldives', code: 'MV' },
      { name: 'Nepal', code: 'NP' },
      { name: 'Pakistan', code: 'PK' },
      { name: 'Sri Lanka', code: 'LK' },
    ],
  },
  {
    id: 'east-asia',
    label: 'East Asia',
    countries: [
      { name: 'China', code: 'CN' },
      { name: 'Japan', code: 'JP' },
      { name: 'Mongolia', code: 'MN' },
      { name: 'North Korea', code: 'KP' },
      { name: 'South Korea', code: 'KR' },
      { name: 'Taiwan', code: 'TW' },
      { name: 'Hong Kong', code: 'HK' },
      { name: 'Macau', code: 'MO' },
    ],
  },
  {
    id: 'southeast-asia',
    label: 'Southeast Asia',
    countries: [
      { name: 'Brunei', code: 'BN' },
      { name: 'Cambodia', code: 'KH' },
      { name: 'Indonesia', code: 'ID' },
      { name: 'Laos', code: 'LA' },
      { name: 'Malaysia', code: 'MY' },
      { name: 'Myanmar', code: 'MM' },
      { name: 'Philippines', code: 'PH' },
      { name: 'Singapore', code: 'SG' },
      { name: 'Thailand', code: 'TH' },
      { name: 'Timor-Leste', code: 'TL' },
      { name: 'Vietnam', code: 'VN' },
    ],
  },
  {
    id: 'oceania',
    label: 'Oceania',
    countries: [
      { name: 'Australia', code: 'AU' },
      { name: 'New Zealand', code: 'NZ' },
      { name: 'Fiji', code: 'FJ' },
      { name: 'Papua New Guinea', code: 'PG' },
      { name: 'Solomon Islands', code: 'SB' },
      { name: 'Vanuatu', code: 'VU' },
      { name: 'Samoa', code: 'WS' },
      { name: 'Tonga', code: 'TO' },
      { name: 'Kiribati', code: 'KI' },
      { name: 'Micronesia', code: 'FM' },
      { name: 'Marshall Islands', code: 'MH' },
      { name: 'Palau', code: 'PW' },
      { name: 'Nauru', code: 'NR' },
      { name: 'Tuvalu', code: 'TV' },
      { name: 'Cook Islands', code: 'CK' },
      { name: 'Niue', code: 'NU' },
      { name: 'Tokelau', code: 'TK' },
      { name: 'French Polynesia', code: 'PF' },
      { name: 'New Caledonia', code: 'NC' },
      { name: 'Guam', code: 'GU' },
      { name: 'Northern Mariana Islands', code: 'MP' },
      { name: 'American Samoa', code: 'AS' },
      { name: 'Wallis and Futuna', code: 'WF' },
    ],
  },
];

function buildFilteredRegions() {
  return REGIONS.map((region) => ({
    ...region,
    countries: region.countries.filter(
      (country) => getCountryFlagIcon(country.code) !== null,
    ),
  })).filter((region) => region.countries.length > 0);
}

export function RailyardTaggingRegions() {
  const regions = React.useMemo(buildFilteredRegions, []);
  const [activeRegionId, setActiveRegionId] = React.useState(
    regions[0]?.id ?? '',
  );
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (!regions.some((region) => region.id === activeRegionId)) {
      setActiveRegionId(regions[0]?.id ?? '');
    }
  }, [activeRegionId, regions]);

  const activeRegion =
    regions.find((region) => region.id === activeRegionId) ??
    regions[0] ??
    null;

  const countryIndex = React.useMemo(
    () =>
      regions.flatMap((region) =>
        region.countries.map((country) => ({
          regionId: region.id,
          country,
        })),
      ),
    [regions],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleCountries = React.useMemo(() => {
    if (!activeRegion) return [];
    if (!normalizedSearch) return activeRegion.countries;
    return activeRegion.countries.filter((country) =>
      country.name.toLowerCase().includes(normalizedSearch),
    );
  }, [activeRegion, normalizedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    const query = value.trim().toLowerCase();
    if (!query) return;

    const match = countryIndex.find((entry) =>
      entry.country.name.toLowerCase().includes(query),
    );
    if (!match) return;

    setActiveRegionId(match.regionId);
  };

  if (!activeRegion) return null;

  return (
    <div className="my-8 rounded-2xl border border-border/70 bg-card/30 p-5 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-2">
          <label
            htmlFor="tagging-region"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Region
          </label>
          <div className="relative">
            <select
              id="tagging-region"
              value={activeRegion.id}
              onChange={(event) => setActiveRegionId(event.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-border/70 bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tagging-country-search"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Country Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="tagging-country-search"
              type="text"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search countries..."
              className="h-10 w-full rounded-lg border border-border/70 bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60"
            />
          </div>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCountries.map((country) => {
          const Flag = getCountryFlagIcon(country.code);
          if (!Flag) return null;

          return (
            <li
              key={country.code}
              className="flex items-center gap-3 rounded-lg border border-border/55 bg-background/55 px-3 py-2.5"
            >
              <Flag
                className="h-4 w-6 shrink-0 rounded-[2px] object-cover ring-1 ring-border/60"
                aria-hidden="true"
              />
              <span className="text-sm leading-tight">{country.name}</span>
            </li>
          );
        })}
      </ul>

      {visibleCountries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No matching countries found for this region.
        </p>
      ) : null}
    </div>
  );
}
