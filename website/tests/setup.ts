import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installSharedJsdomMocks } from '../../testing/jsdom';

afterEach(() => {
  cleanup();
});

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    fill?: boolean;
  }) => {
    const normalizedSrc = typeof src === 'string' ? src : '';
    void fill;
    return React.createElement('img', { ...props, alt, src: normalizedSrc });
  },
}));

installSharedJsdomMocks({ createSpy: () => vi.fn() });
