export async function copyPlaygroundContent(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is not available.");
  }

  await navigator.clipboard.writeText(value);
}
