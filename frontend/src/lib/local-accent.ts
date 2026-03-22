export type LocalAccentTone =
  | 'install'
  | 'uninstall'
  | 'update'
  | 'import'
  | 'files';

type LocalAccentVariantClasses = {
  solidButton: string;
  outlineButton: string;
  iconButton: string;
  dialogCancel: string;
  dialogPanel: string;
};

type LocalAccentTokenName = `${LocalAccentTone}-primary`;
type LocalAccentForegroundTokenName = `${LocalAccentTone}-foreground`;

type LocalAccentTokenPair = {
  primary: LocalAccentTokenName;
  foreground: LocalAccentForegroundTokenName;
};

function localAccentVar(token: string) {
  return `var(--${token})`;
}

function localAccentMix(token: string, percent: number) {
  return `color-mix(in_srgb,var(--${token})_${percent}%,transparent)`;
}

function buildToneClasses({
  primary,
  foreground,
}: LocalAccentTokenPair): LocalAccentVariantClasses {
  const primaryVar = localAccentVar(primary);
  const foregroundVar = localAccentVar(foreground);
  const hoverTone20 = localAccentMix(primary, 20);
  const borderTone45 = localAccentMix(primary, 45);
  const panelTone12 = localAccentMix(primary, 12);

  return {
    solidButton: `!bg-[${primaryVar}] !text-[${foregroundVar}] hover:!brightness-90 hover:!text-[${foregroundVar}]`,
    outlineButton: `border-[${primaryVar}] text-[${primaryVar}] hover:!bg-[${hoverTone20}] hover:!text-[${primaryVar}]`,
    iconButton: `text-[${primaryVar}] hover:!bg-[${hoverTone20}] hover:!text-[${primaryVar}]`,
    dialogCancel: `border-[${borderTone45}] text-[${primaryVar}] hover:!bg-[${hoverTone20}] hover:!text-[${primaryVar}]`,
    dialogPanel: `border-[${borderTone45}] bg-[${panelTone12}]`,
  };
}

const LOCAL_ACCENT_TOKEN_PAIRS: Record<LocalAccentTone, LocalAccentTokenPair> = {
  install: { primary: 'install-primary', foreground: 'install-foreground' },
  uninstall: {
    primary: 'uninstall-primary',
    foreground: 'uninstall-foreground',
  },
  update: { primary: 'update-primary', foreground: 'update-foreground' },
  import: { primary: 'import-primary', foreground: 'import-foreground' },
  files: { primary: 'files-primary', foreground: 'files-foreground' },
};

const LOCAL_ACCENT_TONE_CLASSES: Record<LocalAccentTone, LocalAccentVariantClasses> =
  Object.fromEntries(
    Object.entries(LOCAL_ACCENT_TOKEN_PAIRS).map(([tone, tokens]) => [
      tone,
      buildToneClasses(tokens),
    ])
  ) as Record<LocalAccentTone, LocalAccentVariantClasses>;

export function getLocalAccentClasses(tone: LocalAccentTone) {
  return LOCAL_ACCENT_TONE_CLASSES[tone];
}
