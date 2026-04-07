import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppNavbarItem } from '@/config/navigation/navbar';
import { NavbarItemView } from '@/components/app-shell/navigation/app-navbar/navbar-item';

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

const noopStyleVars = {} as React.CSSProperties;

function renderItem(item: AppNavbarItem, pathname = '/') {
  const onNavigate = vi.fn();
  const setTheme = vi.fn();
  render(
    <NavbarItemView
      item={item}
      pathname={pathname}
      onNavigate={onNavigate}
      setTheme={setTheme}
      configStyleVars={noopStyleVars}
    />,
  );

  return { onNavigate, setTheme };
}

describe('NavbarItemView', () => {
  it('renders internal links and marks nested route as active', () => {
    renderItem(
      {
        id: 'railyard',
        title: 'Railyard',
        href: '/railyard',
        position: 'left',
      },
      '/railyard/docs',
    );

    const link = screen.getByRole('link', { name: 'Railyard' });
    expect(link).toHaveAttribute('href', '/railyard');
    expect(link).toHaveAttribute('data-active', 'true');
  });

  it('renders external links with new-tab attributes', () => {
    renderItem({
      id: 'github',
      title: 'GitHub',
      href: 'https://github.com/Subway-Builder-Modded',
      position: 'right',
    });

    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('marks parent item active when dropdown activeMatchPaths matches', async () => {
    renderItem(
      {
        id: 'railyard',
        title: 'Railyard',
        href: '/railyard',
        position: 'left',
        dropdown: [
          {
            id: 'browse',
            title: 'Browse',
            href: '/railyard/browse',
            activeMatchPaths: ['/railyard/mods'],
          },
        ],
      },
      '/railyard/mods',
    );

    const trigger = screen.getByRole('button', { name: 'Railyard' });
    expect(trigger).toHaveAttribute('data-active', 'true');

    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);
    expect(
      await screen.findByRole('menuitem', { name: 'Browse' }),
    ).toBeVisible();
  });

  it('renders external dropdown links with expected attributes', async () => {
    renderItem({
      id: 'community',
      title: 'Community',
      href: 'https://discord.gg/syG9YHMyeG',
      position: 'right',
      dropdown: [
        {
          id: 'discord',
          title: 'Discord',
          href: 'https://discord.gg/syG9YHMyeG',
        },
      ],
    });

    const trigger = screen.getByRole('button', { name: 'Community' });
    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);
    const item = await screen.findByRole('menuitem', { name: 'Discord' });
    const link = item.closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('calls setTheme and onNavigate when a theme dropdown action is selected', async () => {
    const user = userEvent.setup();
    const { onNavigate, setTheme } = renderItem({
      id: 'theme',
      title: 'Theme',
      position: 'right',
      dropdown: [
        {
          id: 'theme-dark',
          title: 'Dark',
          action: { type: 'theme', theme: 'dark' },
        },
      ],
    });

    const trigger = screen.getByRole('button', { name: 'Theme' });
    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'Dark' }));

    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
