export interface WailsDeepLinkTarget {
  type?: string;
  id?: string;
}

export interface ResolvedDeepLink {
  route: string | null;
  shouldLaunchGame: boolean;
}

export function resolveWailsDeepLink(
  target: WailsDeepLinkTarget | null | undefined,
  getProjectRoute: (type: string, id: string) => string,
): ResolvedDeepLink {
  if (!target?.type) {
    return { route: null, shouldLaunchGame: false };
  }

  if (target.type === 'GameStart') {
    return { route: null, shouldLaunchGame: true };
  }

  if (!target.id) {
    return { route: null, shouldLaunchGame: false };
  }

  return {
    route: getProjectRoute(target.type, target.id),
    shouldLaunchGame: false,
  };
}