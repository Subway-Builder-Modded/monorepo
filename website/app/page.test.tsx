import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Page from '@/app/page';
import {
  HOME_CONTRIBUTE_SECTION,
  HOME_COMMUNITY_SECTION,
  HOME_HERO,
  HOME_OPEN_SOURCE_SECTION,
  HOME_PROJECT_SECTION,
} from '@/config/site/homepage';

vi.mock('@/features/home/components/home-hero-background', () => ({
  HomeHeroBackground: ({ alt }: { alt: string }) => (
    <div data-testid="home-hero-background" aria-label={alt} />
  ),
}));

describe('home page', () => {
  it('renders hero and all major configured sections', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', { name: HOME_HERO.title }),
    ).toBeVisible();
    expect(screen.getByTestId('home-hero-background')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: HOME_PROJECT_SECTION.title }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: HOME_OPEN_SOURCE_SECTION.title }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: HOME_CONTRIBUTE_SECTION.title }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: HOME_COMMUNITY_SECTION.title }),
    ).toBeVisible();
  });

  it('renders project cards and key links from config', () => {
    render(<Page />);

    for (const card of HOME_PROJECT_SECTION.cards) {
      expect(screen.getByRole('heading', { name: card.title })).toBeVisible();
      expect(screen.getByText(card.description)).toBeVisible();
    }

    for (const action of HOME_HERO.primaryActions) {
      expect(
        screen.getAllByRole('link', { name: action.label }).length,
      ).toBeGreaterThan(0);
    }
  });
});
