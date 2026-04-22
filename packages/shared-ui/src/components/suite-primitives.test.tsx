// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SuiteAccentButton,
  SuiteAccentLink,
  SuiteBadge,
  SuiteStatusChip,
} from '../index';

describe('suite shared primitives', () => {
  it('renders suite badge with descender-safe classes', () => {
    render(<SuiteBadge>registry</SuiteBadge>);

    const badge = screen.getByText('registry');
    // pt-px nudges text down for correct optical vertical centering; descenders
    // have ample room because the badge height is much larger than the line-height.
    expect(badge.className).toContain('pt-px');
    expect(badge.className).not.toContain('pb-px');
    expect(badge.className).not.toContain('leading-none');
  });

  it('renders suite status chip labels', () => {
    render(
      <>
        <SuiteStatusChip status="latest" />
        <SuiteStatusChip status="deprecated" deprecatedTone="gray" />
      </>,
    );

    expect(screen.getByText('LATEST')).toBeTruthy();
    expect(screen.getByText('DEPRECATED')).toBeTruthy();
  });

  it('applies accent style overrides on link and button primitives', () => {
    render(
      <>
        <SuiteAccentLink href="/docs" accent={{ light: '#129770', dark: '#3fe0b4' }}>
          Docs link
        </SuiteAccentLink>
        <SuiteAccentButton accent={{ light: '#129770', dark: '#3fe0b4' }} tone="outline">
          Open docs
        </SuiteAccentButton>
      </>,
    );

    const link = screen.getByRole('link', { name: 'Docs link' });
    const button = screen.getByRole('button', { name: 'Open docs' });

    expect(link.getAttribute('style')).toContain('--suite-accent-light');
    expect(button.getAttribute('style')).toContain('--suite-accent-dark');
  });
});
