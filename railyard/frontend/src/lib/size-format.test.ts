import { describe, expect, it } from 'vitest';

import { formatStorageSize } from './size-format';

describe('formatStorageSize', () => {
  it('returns bytes for small values and zero-like inputs', () => {
    expect(formatStorageSize(512)).toBe('512 B');
    expect(formatStorageSize(0)).toBe('0 B');
    expect(formatStorageSize(undefined)).toBe('0 B');
    expect(formatStorageSize(Number.NaN)).toBe('0 B');
    expect(formatStorageSize(-10)).toBe('0 B');
  });

  it('formats kibibytes and mebibytes', () => {
    expect(formatStorageSize(1024)).toBe('1.00 KB');
    expect(formatStorageSize(5 * 1024 + 512)).toBe('5.50 KB');
    expect(formatStorageSize(1024 ** 2)).toBe('1.00 MB');
  });

  it('formats gibibytes with one decimal place', () => {
    expect(formatStorageSize(1024 ** 3)).toBe('1.0 GB');
    expect(formatStorageSize(1.25 * 1024 ** 3)).toBe('1.3 GB');
  });
});
