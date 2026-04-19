export type ProjectVersionSortField = 'version' | 'date' | 'downloads';

export interface ProjectVersionSortState {
  field: ProjectVersionSortField;
  direction: 'asc' | 'desc';
}

export const DEFAULT_PROJECT_VERSION_SORT: ProjectVersionSortState = {
  field: 'date',
  direction: 'desc',
};

export interface ProjectVersionRowLike {
  version: string;
  date: string;
  downloads: number;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatUTCDate(parts: {
  year: number;
  month: number;
  day: number;
  hours?: number;
  minutes?: number;
}): string {
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  if (parts.hours === undefined || parts.minutes === undefined) {
    return `${year}-${month}-${day} UTC`;
  }
  const hours = String(parts.hours).padStart(2, '0');
  const minutes = String(parts.minutes).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function parseProjectVersionDate(date: string): number | null {
  if (DATE_ONLY_PATTERN.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }

  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function toggleProjectVersionSort(
  previous: ProjectVersionSortState,
  field: ProjectVersionSortField,
): ProjectVersionSortState {
  if (previous.field === field) {
    return {
      field,
      direction: previous.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return { field, direction: 'desc' };
}

export function sortProjectVersions<T extends ProjectVersionRowLike>(
  versions: T[],
  sort: ProjectVersionSortState,
  compareVersion: (a: string, b: string) => number = (a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
): T[] {
  return [...versions].sort((left, right) => {
    let comparison = 0;

    if (sort.field === 'date') {
      comparison =
        (parseProjectVersionDate(left.date) ?? 0) -
        (parseProjectVersionDate(right.date) ?? 0);
    } else if (sort.field === 'downloads') {
      comparison = left.downloads - right.downloads;
    } else {
      comparison = compareVersion(left.version, right.version);
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

export function formatProjectVersionDate(date: string): string {
  if (DATE_ONLY_PATTERN.test(date)) {
    return `${date} UTC`;
  }

  const timestamp = parseProjectVersionDate(date);
  if (timestamp === null) return date;

  const parsed = new Date(timestamp);
  return formatUTCDate({
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
    hours: parsed.getUTCHours(),
    minutes: parsed.getUTCMinutes(),
  });
}
