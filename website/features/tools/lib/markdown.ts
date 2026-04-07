import TurndownService from 'turndown';
import { marked } from 'marked';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
});

turndown.addRule('underline', {
  filter: ['u'],
  replacement(content) {
    if (!content.trim()) return '';
    return `<u>${content}</u>`;
  },
});

export function richTextHtmlToMarkdown(html: string) {
  return turndown.turndown(html).trim();
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function markdownToHtml(markdown: string) {
  return marked.parse(markdown, { async: false }).trim();
}

export function toInlineHtml(html: string) {
  const normalized = html.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const segments = normalized.split(/(<pre><code[\s\S]*?<\/code><\/pre>)/g);

  return segments
    .map((segment) => {
      if (segment.startsWith('<pre><code')) {
        return segment.replace(
          /(<pre><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/,
          (_, open, code, close) =>
            `${open}${String(code).replace(/\n/g, '&#10;')}${close}`,
        );
      }

      return segment.replace(/\n+/g, '').replace(/>\s+</g, '><').trim();
    })
    .join('');
}

export function toInlineMarkdown(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const headingSafe = normalized
    .split('\n')
    .map((line) => {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (!headingMatch) return line;
      const content = headingMatch[2].trim();
      return content ? `**${content}**` : line;
    })
    .join('\n');

  return headingSafe.replace(/\n/g, '<br />');
}
