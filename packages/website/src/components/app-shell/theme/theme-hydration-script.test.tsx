import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeHydrationScript } from '@/components/app-shell/theme/theme-hydration-script';

describe('ThemeHydrationScript', () => {
  it('renders a hydration script that applies light/dark class early', () => {
    const { container } = render(<ThemeHydrationScript />);
    const script = container.querySelector('script');

    expect(script).toBeTruthy();
    expect(script?.innerHTML).toContain('localStorage.getItem("theme")');
    expect(script?.innerHTML).toContain('classList.add(theme)');
    expect(script?.innerHTML).toContain('colorScheme=theme');
  });
});
