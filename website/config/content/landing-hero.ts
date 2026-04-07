import type { HomeButtonSize } from '@/config/site/homepage';

export type HeroActionId = 'template-mod-get-started' | 'template-mod-docs';

export type HeroActionConfig = {
  id: HeroActionId;
  labelMd: string;
  href: string;
  external?: boolean;
  variant: 'solid' | 'outline';
  size: HomeButtonSize;
};

export const LANDING_HERO_COPY = {
  railyard: {
    versionLabelMd: 'Version: `{{currentVersion}}`',
    titleMd: 'Railyard',
    betaBadgeMd: 'Beta',
    descriptionMd: 'All-in-one Map and Mod Manager for Subway Builder.',
    downloadLabelMd: 'Download for {{nativeLabel}}',
    mapCountLabelMd: 'Maps',
    modCountLabelMd: 'Mods',
    docsAriaLabel: 'Open Railyard documentation',
    discordAriaLabel: 'Join the Subway Builder Modded Discord',
    worldMapAriaLabel: 'Open the Railyard world map',
  },
  templateMod: {
    versionLabelMd: 'Version: `{{currentVersion}}`',
    titleMd: 'Template Mod',
    descriptionMd:
      'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
    actions: [
      {
        id: 'template-mod-get-started',
        labelMd: 'Get Started',
        href: 'https://github.com/new?template_name=template-mod&template_owner=Subway-Builder-Modded',
        external: true,
        variant: 'solid',
        size: 'md',
      },
      {
        id: 'template-mod-docs',
        labelMd: 'Documentation',
        href: '/template-mod/docs',
        variant: 'outline',
        size: 'md',
      },
    ] satisfies HeroActionConfig[],
  },
} as const;

export function interpolateHeroText(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => values[key] ?? '',
  );
}
