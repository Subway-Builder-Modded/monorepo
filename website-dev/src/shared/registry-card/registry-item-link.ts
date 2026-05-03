/**
 * Builds the canonical href for a registry item detail page.
 *
 * @param routeSegment - The asset type route segment, e.g. "maps" or "mods".
 * @param id - The item id.
 */
export function buildRegistryItemHref(routeSegment: string, id: string): string {
  return `/registry/${routeSegment}/${id}`;
}

/** Returns the /registry landing page URL. */
export function getRegistryIndexHref(): string {
  return "/registry";
}
