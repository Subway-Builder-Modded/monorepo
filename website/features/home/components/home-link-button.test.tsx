import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeLinkButton } from '@/features/home/components/home-link-button';
import type { HomeLink } from '@/config/site/homepage';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('HomeLinkButton', () => {
  it('renders external links with target and rel', () => {
    const link: HomeLink = {
      label: 'GitHub',
      href: 'https://github.com/Subway-Builder-Modded',
      external: true,
      variant: 'solid',
      size: 'md',
    };

    render(<HomeLinkButton link={link} />);
    const anchor = screen.getByRole('link', { name: 'GitHub' });
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders internal links without forcing new tab', () => {
    const link: HomeLink = {
      label: 'Credits',
      href: '/credits',
      variant: 'outline',
      size: 'md',
    };

    render(<HomeLinkButton link={link} />);
    const anchor = screen.getByRole('link', { name: 'Credits' });
    expect(anchor).toHaveAttribute('href', '/credits');
    expect(anchor).not.toHaveAttribute('target');
  });
});
