import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MdxIcon } from '@/components/mdx/platform/icons';

describe('MdxIcon', () => {
  it('renders lucide icons by name', () => {
    const { container } = render(<MdxIcon name="Plus" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders shared asset icons by registry name', () => {
    render(<MdxIcon name="github" />);
    expect(
      document.querySelector('[style*="/assets/github.svg"]'),
    ).toBeTruthy();
  });

  it('uses fallback and warns for invalid icon names', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    render(
      <MdxIcon name="nope-icon" fallback={<span data-testid="fallback" />} />,
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[MDX Icon] Unknown icon "nope-icon".',
    );

    consoleWarnSpy.mockRestore();
  });
});
