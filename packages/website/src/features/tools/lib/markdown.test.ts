import { describe, expect, it } from 'vitest';
import {
  markdownToHtml,
  richTextHtmlToMarkdown,
  toInlineHtml,
  toInlineMarkdown,
} from '@/features/tools/lib/markdown';

describe('richTextHtmlToMarkdown', () => {
  it('converts formatted html to markdown', () => {
    const markdown = richTextHtmlToMarkdown(
      '<h1>Title</h1><p>Hello <strong>world</strong> and <em>friends</em>.</p>',
    );

    expect(markdown).toContain('# Title');
    expect(markdown).toContain('Hello **world** and *friends*.');
  });

  it('preserves underline as html tags', () => {
    const markdown = richTextHtmlToMarkdown('<p><u>Underlined</u> copy</p>');

    expect(markdown).toBe('<u>Underlined</u> copy');
  });
});

describe('toInlineMarkdown', () => {
  it('returns one line while preserving line boundaries via br tags', () => {
    expect(toInlineMarkdown('line 1\nline 2\n\nline 4')).toBe(
      'line 1<br />line 2<br /><br />line 4',
    );
  });

  it('converts heading lines to bold markdown in inline mode', () => {
    expect(toInlineMarkdown('# Title\nBody copy')).toBe(
      '**Title**<br />Body copy',
    );
  });

  it('normalizes windows newlines and trims empty content', () => {
    expect(toInlineMarkdown('\r\n hello\r\n')).toBe('hello');
    expect(toInlineMarkdown('   \n')).toBe('');
  });
});

describe('markdownToHtml', () => {
  it('renders headings, quotes, and lists as semantic html', () => {
    const html = markdownToHtml('# Title\n\n> Quote\n\n- item 1\n- item 2');

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item 1</li>');
  });
});

describe('toInlineHtml', () => {
  it('keeps code blocks clean and preserves code newlines without br tags', () => {
    const html = markdownToHtml('```ts\nline1\nline2\n```\n\nNext');
    const inline = toInlineHtml(html);

    expect(inline).toContain('<pre><code');
    expect(inline).not.toContain('<br />line1');
    expect(inline).toContain('line1&#10;line2');
  });
});
