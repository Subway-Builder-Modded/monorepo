import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageColorSchemeProvider } from '@/components/app-shell/theme/page-color-scheme-provider';

const mockUsePathname = vi.fn<() => string | null>();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('PageColorSchemeProvider', () => {
  it('applies the resolved color scheme to the wrapper element', () => {
    mockUsePathname.mockReturnValue('/railyard/docs');
    render(
      <PageColorSchemeProvider>
        <div data-testid="child">content</div>
      </PageColorSchemeProvider>,
    );

    const child = screen.getByTestId('child');
    const wrapper = child.parentElement;
    expect(wrapper).toHaveAttribute('data-color-scheme', 'railyard');
  });

  it('falls back to default scheme when pathname is null', () => {
    mockUsePathname.mockReturnValue(null);
    render(
      <PageColorSchemeProvider>
        <div data-testid="child">content</div>
      </PageColorSchemeProvider>,
    );

    const child = screen.getByTestId('child');
    const wrapper = child.parentElement;
    expect(wrapper).toHaveAttribute('data-color-scheme', 'default');
  });
});
