import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from '@/app/not-found';

describe('not found page', () => {
  it('forces the Return Home button to the default color scheme', () => {
    render(<NotFound />);

    const returnHome = screen.getByRole('link', { name: 'Return Home' });
    expect(returnHome).toHaveAttribute('data-color-scheme', 'default');
  });
});
