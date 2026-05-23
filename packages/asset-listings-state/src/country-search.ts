const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;
const ENGLISH_REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

type CountrySearchOverride = {
  exonym?: string;
  endonym?: string;
  aliases?: string[];
};

const COUNTRY_SEARCH_OVERRIDES: Record<string, CountrySearchOverride> = {
  CI: {
    aliases: ['Ivory Coast'],
  },
  CZ: {
    aliases: ['Czech Republic'],
  },
  GB: {
    aliases: ['UK', 'Britain', 'Great Britain'],
  },
  MK: {
    aliases: ['Macedonia'],
  },
  MM: {
    aliases: ['Burma'],
  },
  SZ: {
    aliases: ['Swaziland'],
  },
  TL: {
    aliases: ['East Timor'],
  },
  XK: {
    exonym: 'Kosovo',
    endonym: 'Kosove',
  },
};

const countrySearchTermCache = new Map<string, string[]>();

export function normalizeCountryCode(
  code: string | null | undefined,
): string | undefined {
  const normalized = (code ?? '').trim().toUpperCase();
  return COUNTRY_CODE_PATTERN.test(normalized) ? normalized : undefined;
}

export function normalizeMapCountry(country: string | null | undefined): string {
  return normalizeCountryCode(country) ?? '';
}

function uniqueTerms(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function toSearchTermVariants(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const asciiFolded = trimmed.normalize('NFKD').replace(/\p{M}+/gu, '');
  return uniqueTerms([trimmed, asciiFolded]);
}

function getRegionName(locale: string, code: string): string | undefined {
  try {
    const displayName =
      locale === 'en'
        ? ENGLISH_REGION_NAMES.of(code)
        : new Intl.DisplayNames([locale], { type: 'region' }).of(code);
    if (!displayName || displayName.toUpperCase() === code) {
      return undefined;
    }
    return displayName;
  } catch {
    return undefined;
  }
}

function getCountryEndonym(code: string): string | undefined {
  try {
    const locale = new Intl.Locale(`und-${code}`).maximize();
    return getRegionName(locale.baseName, code);
  } catch {
    return undefined;
  }
}

export function reverseIsoCountryCodeToNames(code: string): string[] {
  const normalized = normalizeCountryCode(code);
  if (!normalized) {
    return [];
  }

  const cached = countrySearchTermCache.get(normalized);
  if (cached) {
    return cached;
  }

  const overrides = COUNTRY_SEARCH_OVERRIDES[normalized];
  const terms = uniqueTerms([
    normalized,
    overrides?.exonym ?? getRegionName('en', normalized) ?? '',
    overrides?.endonym ?? getCountryEndonym(normalized) ?? '',
    ...(overrides?.aliases ?? []),
  ]).flatMap(toSearchTermVariants);

  const deduped = uniqueTerms(terms);
  countrySearchTermCache.set(normalized, deduped);
  return deduped;
}

export function buildCountryCodeSearchTerms(
  country: string | null | undefined,
): string[] {
  const normalized = normalizeCountryCode(country);
  return normalized ? reverseIsoCountryCodeToNames(normalized) : [];
}
