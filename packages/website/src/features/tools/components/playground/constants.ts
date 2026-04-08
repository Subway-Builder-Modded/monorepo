import type { JSONContent } from '@tiptap/react';

export type OutputMode = 'normal' | 'inline' | 'preview';
export type InputMode = 'rich-text' | 'markdown';

export const DOC_STORAGE_KEY = 'tools:playground:doc';
export const OUTPUT_MODE_STORAGE_KEY = 'tools:playground:output-mode';
export const INPUT_MODE_STORAGE_KEY = 'tools:playground:input-mode';
export const MARKDOWN_SOURCE_STORAGE_KEY = 'tools:playground:markdown-source';

export const DEFAULT_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Playground' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Write rich text on the left, then copy generated markdown from the right.',
        },
      ],
    },
  ],
};

export function parseDocument(value: string): JSONContent {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed as JSONContent;
    }
  } catch {
    // Ignore invalid persisted content and use a clean document.
  }

  return DEFAULT_DOCUMENT;
}
