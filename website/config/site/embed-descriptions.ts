type EmbedDescriptionOverrideMap = Record<string, string>;

// Keys are absolute pathname values (for example: "/railyard/docs/v0.2/players").
export const EMBED_DESCRIPTION_OVERRIDES: EmbedDescriptionOverrideMap = {
  '/railyard/docs': 'All-in-one Map and Mod Manager for Subway Builder.',
  '/template-mod/docs':
    'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
  '/railyard/updates': 'All-in-one Map and Mod Manager for Subway Builder.',
  '/template-mod/updates':
    'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
};

export function resolveEmbedDescription(
  pathname: string,
  fallback: string,
): string {
  const override = EMBED_DESCRIPTION_OVERRIDES[pathname]?.trim();
  return override && override.length > 0 ? override : fallback;
}
