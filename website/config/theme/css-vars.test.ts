import { describe, expect, it } from 'vite-plus/test';
import { getSuiteColorVarRefs } from '@/config/theme/css-vars';

describe('getSuiteColorVarRefs', () => {
  it('returns suite CSS variable references for color roles', () => {
    expect(getSuiteColorVarRefs('accentColor')).toEqual({
      light: 'var(--suite-accent-light)',
      dark: 'var(--suite-accent-dark)',
    });
    expect(getSuiteColorVarRefs('textColorInverted')).toEqual({
      light: 'var(--suite-text-inverted-light)',
      dark: 'var(--suite-text-inverted-dark)',
    });
  });
});
