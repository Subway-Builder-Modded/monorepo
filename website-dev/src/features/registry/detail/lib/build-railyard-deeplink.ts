export function buildRailyardDeeplink(routeSegment: string, id: string): string {
  const type = encodeURIComponent(routeSegment);
  const encodedId = encodeURIComponent(id);
  return `railyard://open?type=${type}&id=${encodedId}`;
}
