import { describe, expect, it } from 'vite-plus/test';

import { getLocalAccentClasses, getToneVarsClass, LOCAL_ACCENTS } from './local-accent';

describe('local-accent helpers', () => {
  it('returns tone variable classes for each shared accent tone', () => {
    expect(getToneVarsClass('install')).toContain('--install-primary');
    expect(getToneVarsClass('profiles')).toContain('--profiles-primary');
  });

  it('exposes complete button and dialog class contracts per tone', () => {
    const install = getLocalAccentClasses('install');

    expect(install.solidButton).toContain('--local-tone-primary');
    expect(install.outlineButton).toContain('--local-tone-primary');
    expect(install.dialogCancel).toContain('--local-tone-primary');
    expect(install.dialogPanel).toContain('--local-tone-primary');
    expect(Object.keys(LOCAL_ACCENTS)).toEqual([
      'install',
      'uninstall',
      'update',
      'import',
      'files',
      'profiles',
    ]);
  });
});