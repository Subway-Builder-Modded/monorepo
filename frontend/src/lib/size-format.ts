export function formatStorageSize(bytes: number | undefined): string {
  const safeBytes =
    typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0
      ? bytes
      : 0;

  if (safeBytes < 1024) return `${safeBytes} B`;
  if (safeBytes < 1024 ** 2) return `${(safeBytes / 1024).toFixed(2)} KB`;
  if (safeBytes < 1024 ** 3) return `${(safeBytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(safeBytes / 1024 ** 3).toFixed(1)} GB`;
}
