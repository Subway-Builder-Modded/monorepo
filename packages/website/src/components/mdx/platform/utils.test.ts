import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  slugify,
  textFromChildren,
  toDimension,
} from '@/components/mdx/platform/utils';

describe('mdx platform utils', () => {
  it('slugifies heading text consistently', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('A   B   C')).toBe('a-b-c');
  });

  it('normalizes numeric dimensions', () => {
    expect(toDimension(128)).toBe(128);
    expect(toDimension(' 42 ')).toBe(42);
    expect(toDimension('')).toBeUndefined();
    expect(toDimension('abc')).toBeUndefined();
  });

  it('extracts text recursively from child nodes', () => {
    expect(
      textFromChildren(
        React.createElement(
          React.Fragment,
          null,
          'Hello ',
          React.createElement('strong', null, 'world'),
          ' ',
          React.createElement(React.Fragment, null, '2026'),
        ),
      ),
    ).toBe('Hello world 2026');
  });
});
