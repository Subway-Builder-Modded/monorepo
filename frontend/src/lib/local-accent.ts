export type LocalAccentTone =
  | 'install'
  | 'uninstall'
  | 'update'
  | 'import'
  | 'files';

type LocalAccentToneClasses = {
  solidButton: string;
  outlineButton: string;
  iconButton: string;
  dialogCancel: string;
  dialogPanel: string;
};

const LOCAL_ACCENT_TONE_CLASSES: Record<
  LocalAccentTone,
  LocalAccentToneClasses
> = {
  install: {
    solidButton:
      '!bg-[var(--install-primary)] !text-[var(--install-foreground)] hover:!brightness-90 hover:!text-[var(--install-foreground)]',
    outlineButton:
      'border-[var(--install-primary)] text-[var(--install-primary)] hover:!bg-[color-mix(in_srgb,var(--install-primary)_20%,transparent)] hover:!text-[var(--install-primary)]',
    iconButton:
      'text-[var(--install-primary)] hover:!bg-[color-mix(in_srgb,var(--install-primary)_20%,transparent)] hover:!text-[var(--install-primary)]',
    dialogCancel:
      'border-[color-mix(in_srgb,var(--install-primary)_45%,transparent)] text-[var(--install-primary)] hover:!bg-[color-mix(in_srgb,var(--install-primary)_20%,transparent)] hover:!text-[var(--install-primary)]',
    dialogPanel:
      'border-[color-mix(in_srgb,var(--install-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--install-primary)_12%,transparent)]',
  },
  uninstall: {
    solidButton:
      '!bg-[var(--uninstall-primary)] !text-[var(--uninstall-foreground)] hover:!brightness-90 hover:!text-[var(--uninstall-foreground)]',
    outlineButton:
      'border-[var(--uninstall-primary)] text-[var(--uninstall-primary)] hover:!bg-[color-mix(in_srgb,var(--uninstall-primary)_20%,transparent)] hover:!text-[var(--uninstall-primary)]',
    iconButton:
      'text-[var(--uninstall-primary)] hover:!bg-[color-mix(in_srgb,var(--uninstall-primary)_20%,transparent)] hover:!text-[var(--uninstall-primary)]',
    dialogCancel:
      'border-[color-mix(in_srgb,var(--uninstall-primary)_45%,transparent)] text-[var(--uninstall-primary)] hover:!bg-[color-mix(in_srgb,var(--uninstall-primary)_20%,transparent)] hover:!text-[var(--uninstall-primary)]',
    dialogPanel:
      'border-[color-mix(in_srgb,var(--uninstall-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--uninstall-primary)_12%,transparent)]',
  },
  update: {
    solidButton:
      '!bg-[var(--update-primary)] !text-[var(--update-foreground)] hover:!brightness-90 hover:!text-[var(--update-foreground)]',
    outlineButton:
      'border-[var(--update-primary)] text-[var(--update-primary)] hover:!bg-[color-mix(in_srgb,var(--update-primary)_20%,transparent)] hover:!text-[var(--update-primary)]',
    iconButton:
      'text-[var(--update-primary)] hover:!bg-[color-mix(in_srgb,var(--update-primary)_20%,transparent)] hover:!text-[var(--update-primary)]',
    dialogCancel:
      'border-[color-mix(in_srgb,var(--update-primary)_45%,transparent)] text-[var(--update-primary)] hover:!bg-[color-mix(in_srgb,var(--update-primary)_20%,transparent)] hover:!text-[var(--update-primary)]',
    dialogPanel:
      'border-[color-mix(in_srgb,var(--update-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--update-primary)_12%,transparent)]',
  },
  import: {
    solidButton:
      '!bg-[var(--import-primary)] !text-[var(--import-foreground)] hover:!brightness-90 hover:!text-[var(--import-foreground)]',
    outlineButton:
      'border-[var(--import-primary)] text-[var(--import-primary)] hover:!bg-[color-mix(in_srgb,var(--import-primary)_20%,transparent)] hover:!text-[var(--import-primary)]',
    iconButton:
      'text-[var(--import-primary)] hover:!bg-[color-mix(in_srgb,var(--import-primary)_20%,transparent)] hover:!text-[var(--import-primary)]',
    dialogCancel:
      'border-[color-mix(in_srgb,var(--import-primary)_45%,transparent)] text-[var(--import-primary)] hover:!bg-[color-mix(in_srgb,var(--import-primary)_20%,transparent)] hover:!text-[var(--import-primary)]',
    dialogPanel:
      'border-[color-mix(in_srgb,var(--import-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--import-primary)_12%,transparent)]',
  },
  files: {
    solidButton:
      '!bg-[var(--files-primary)] !text-[var(--files-foreground)] hover:!brightness-90 hover:!text-[var(--files-foreground)]',
    outlineButton:
      'border-[var(--files-primary)] text-[var(--files-primary)] hover:!bg-[color-mix(in_srgb,var(--files-primary)_20%,transparent)] hover:!text-[var(--files-primary)]',
    iconButton:
      'text-[var(--files-primary)] hover:!bg-[color-mix(in_srgb,var(--files-primary)_20%,transparent)] hover:!text-[var(--files-primary)]',
    dialogCancel:
      'border-[color-mix(in_srgb,var(--files-primary)_45%,transparent)] text-[var(--files-primary)] hover:!bg-[color-mix(in_srgb,var(--files-primary)_20%,transparent)] hover:!text-[var(--files-primary)]',
    dialogPanel:
      'border-[color-mix(in_srgb,var(--files-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--files-primary)_12%,transparent)]',
  },
};

export function getLocalAccentClasses(tone: LocalAccentTone) {
  return LOCAL_ACCENT_TONE_CLASSES[tone];
}
