import type React from 'react';
import { Plus } from 'lucide-react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppIcon } from '@/components/shared/app-icon';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} {...props} />
  ),
}));

describe('AppIcon', () => {
  it('renders lucide icons with decorative defaults', () => {
    render(<AppIcon icon={Plus} />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders mask icons with size overrides', () => {
    const { container } = render(<AppIcon icon="github" size={18} />);
    const mask = container.querySelector('span');
    expect(mask).toBeInTheDocument();
    expect(mask?.getAttribute('style')).toContain('/assets/github.svg');
    expect(mask?.getAttribute('style')).toContain('width: 18px');
  });

  it('renders image icons with non-decorative labels', () => {
    render(<AppIcon icon="logo" decorative={false} label="Site logo" />);
    const image = screen.getByRole('img', { name: 'Site logo' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/logo.png');
  });
});
