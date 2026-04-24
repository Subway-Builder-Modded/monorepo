export function formatUpdateDisplayId(id: string): string {
  return id.replaceAll("/", "+");
}
