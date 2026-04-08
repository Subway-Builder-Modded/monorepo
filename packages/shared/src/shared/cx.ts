/**
 * Lightweight className joiner. Filters falsy values and joins with spaces.
 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}
