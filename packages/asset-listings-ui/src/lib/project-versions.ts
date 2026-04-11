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
        new Date(left.date).getTime() - new Date(right.date).getTime();
    } else if (sort.field === 'downloads') {
      comparison = left.downloads - right.downloads;
    } else {
      comparison = compareVersion(left.version, right.version);
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

export function formatProjectVersionDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}
