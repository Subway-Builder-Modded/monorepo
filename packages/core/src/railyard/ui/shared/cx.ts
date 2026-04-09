/**
 * Lightweight className joiner. Filters falsy values and joins with spaces.
 */
export function cx(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}
