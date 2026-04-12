// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ResultsSummary } from './results-summary';

afterEach(() => {
  cleanup();
});

describe('ResultsSummary', () => {
  it('renders pluralized results with query text', () => {
    render(<ResultsSummary totalResults={12} query="express" />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText(/results/)).toBeTruthy();
    expect(screen.getByText('"express"')).toBeTruthy();
  });

  it('renders loading placeholder instead of results text', () => {
    const { container } = render(<ResultsSummary totalResults={0} loading />);

    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(screen.queryByText(/result/)).toBeNull();
  });
});