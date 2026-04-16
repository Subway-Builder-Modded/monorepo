// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SuiteLoader } from './suite-loader';

afterEach(() => {
  cleanup();
});

describe('SuiteLoader', () => {
  it('renders title, default subtitle, and all steps', () => {
    render(
      <SuiteLoader
        title="Railyard"
        steps={[{ text: 'Loading profile' }, { text: 'Loading registry' }]}
        currentStep={1}
      />,
    );

    expect(screen.getByText('Railyard')).toBeTruthy();
    expect(screen.getByText('Getting things ready...')).toBeTruthy();
    expect(screen.getByText('Loading profile')).toBeTruthy();
    expect(screen.getByText('Loading registry')).toBeTruthy();
  });

  it('omits the heading block when no title is provided', () => {
    render(<SuiteLoader steps={[{ text: 'Booting' }]} currentStep={0} />);

    expect(screen.getByText('Booting')).toBeTruthy();
    expect(screen.queryByText('Getting things ready...')).toBeNull();
  });
});