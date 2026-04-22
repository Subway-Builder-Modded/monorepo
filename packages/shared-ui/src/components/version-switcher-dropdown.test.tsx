// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VersionSwitcherDropdown } from './version-switcher-dropdown';

afterEach(() => {
  cleanup();
});

const items = [
  { id: 'v0.2', label: 'v0.2', status: 'latest' as const },
  { id: 'v0.1', label: 'v0.1', status: 'deprecated' as const },
];

describe('VersionSwitcherDropdown', () => {
  it('renders text first and status pill after text in trigger and row', () => {
    render(
      <VersionSwitcherDropdown
        items={items}
        selectedId='v0.2'
        onSelect={vi.fn()}
        ariaLabel='Choose documentation version'
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Choose documentation version' });
    const triggerText = trigger.textContent ?? '';
    expect(triggerText.indexOf('v0.2')).toBeLessThan(triggerText.indexOf('LATEST'));

    fireEvent.click(trigger);
    const row = screen.getByRole('option', { name: /v0.2/i });
    const rowText = row.textContent ?? '';
    expect(rowText.indexOf('v0.2')).toBeLessThan(rowText.indexOf('LATEST'));
  });

  it('uses suite trigger tone by default and gray trigger tone for deprecated selection', () => {
    const { rerender } = render(
      <VersionSwitcherDropdown
        items={items}
        selectedId='v0.2'
        onSelect={vi.fn()}
        ariaLabel='Choose documentation version'
      />,
    );

    let trigger = screen.getByRole('button', { name: 'Choose documentation version' });
    expect(trigger.getAttribute('data-tone')).toBe('suite');
    expect(trigger.className).toContain('hover:bg-[color-mix(in_srgb,var(--switcher-accent)_12%,transparent)]');
    expect(trigger.className).toContain('hover:text-[var(--switcher-accent)]');

    rerender(
      <VersionSwitcherDropdown
        items={items}
        selectedId='v0.1'
        onSelect={vi.fn()}
        ariaLabel='Choose documentation version'
      />,
    );

    trigger = screen.getByRole('button', { name: 'Choose documentation version' });
    expect(trigger.getAttribute('data-tone')).toBe('deprecated');
    expect(trigger.className).toContain('hover:bg-muted');
    expect(trigger.className).toContain('hover:text-foreground');
  });

  it('shows visible selected state and keeps deprecated pill neutral', () => {
    render(
      <VersionSwitcherDropdown
        items={items}
        selectedId='v0.1'
        onSelect={vi.fn()}
        ariaLabel='Choose documentation version'
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose documentation version' }));

    const deprecatedRow = screen.getByRole('option', { name: /v0.1/i });
    expect(deprecatedRow.getAttribute('aria-selected')).toBe('true');
    expect(deprecatedRow.className).toContain('bg-muted');
    expect(deprecatedRow.className).toContain('text-left');
    expect(deprecatedRow.className).toContain('justify-start');
    expect(deprecatedRow.className).not.toContain('hover:bg-muted');
    expect(deprecatedRow.className).not.toContain('hover:text-foreground');

    const suiteRow = screen.getByRole('option', { name: /v0.2/i });
    expect(suiteRow.className).toContain('hover:bg-[color-mix(in_srgb,var(--switcher-accent)_12%,transparent)]');
    expect(suiteRow.className).toContain('hover:text-[var(--switcher-accent)]');

    const deprecatedPills = screen.getAllByText('DEPRECATED');
    expect(
      deprecatedPills.every(
        (pill) => pill.closest('[data-slot="suite-badge"]')?.getAttribute('data-tone') === 'neutral',
      ),
    ).toBe(true);

    const latestPills = screen.getAllByText('LATEST');
    expect(
      latestPills.every(
        (pill) => pill.closest('[data-slot="suite-badge"]')?.getAttribute('data-tone') === 'soft',
      ),
    ).toBe(true);
  });

  it('adds transform animation classes to trigger chevron', () => {
    render(
      <VersionSwitcherDropdown
        items={items}
        selectedId='v0.2'
        onSelect={vi.fn()}
        ariaLabel='Choose documentation version'
      />,
    );

    const chevron = document.querySelector<SVGSVGElement>(
      'button[aria-label="Choose documentation version"] svg',
    );
    expect(chevron).not.toBeNull();
    const chevronClassName = chevron?.getAttribute('class') ?? '';
    expect(chevronClassName).toContain('transition-transform');
  });
});