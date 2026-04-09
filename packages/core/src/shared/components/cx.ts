type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, unknown>;

function appendClass(parts: string[], value: ClassValue): void {
  if (!value) return;

  if (typeof value === 'string' || typeof value === 'number') {
    parts.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendClass(parts, item);
    }
    return;
  }

  for (const [key, shouldInclude] of Object.entries(value)) {
    if (shouldInclude) {
      parts.push(key);
    }
  }
}

export function cn(...values: ClassValue[]): string {
  const parts: string[] = [];
  for (const value of values) {
    appendClass(parts, value);
  }
  return parts.join(' ');
}
