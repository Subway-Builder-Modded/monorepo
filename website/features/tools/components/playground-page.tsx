'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileCode2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { usePersistedState } from '@/lib/use-persisted-state';
import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import {
  markdownToHtml,
  richTextHtmlToMarkdown,
  toInlineHtml,
} from '@/features/tools/lib/markdown';
import {
  DEFAULT_DOCUMENT,
  DOC_STORAGE_KEY,
  INPUT_MODE_STORAGE_KEY,
  MARKDOWN_SOURCE_STORAGE_KEY,
  OUTPUT_MODE_STORAGE_KEY,
  parseDocument,
  type InputMode,
  type OutputMode,
} from '@/features/tools/components/playground/constants';
import { PlaygroundInputPanel } from '@/features/tools/components/playground/input-panel';
import { PlaygroundIntroCard } from '@/features/tools/components/playground/intro-card';
import { PlaygroundOutputPanel } from '@/features/tools/components/playground/output-panel';

export function PlaygroundPage() {
  const [copied, setCopied] = useState(false);
  const [documentValue, setDocumentValue] = useState<string>(
    JSON.stringify(DEFAULT_DOCUMENT),
  );
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [inputMode, setInputMode] = usePersistedState<InputMode>(
    INPUT_MODE_STORAGE_KEY,
    'rich-text',
  );
  const [outputMode, setOutputMode] = usePersistedState<OutputMode>(
    OUTPUT_MODE_STORAGE_KEY,
    'normal',
  );
  const [markdownSource, setMarkdownSource] = usePersistedState<string>(
    MARKDOWN_SOURCE_STORAGE_KEY,
    '',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(DOC_STORAGE_KEY);
      if (stored) {
        setDocumentValue(stored);
      }
    } catch {
      // Ignore storage failures and continue with default content.
    }

    setIsEditorReady(true);
  }, []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
      ],
      immediatelyRender: false,
      autofocus: false,
      editable: isEditorReady,
      content: parseDocument(documentValue),
      onCreate({ editor: currentEditor }) {
        const markdown = richTextHtmlToMarkdown(currentEditor.getHTML());
        if (!markdownSource.trim()) {
          setMarkdownSource(markdown);
        }
      },
      onUpdate({ editor: currentEditor }) {
        const markdown = richTextHtmlToMarkdown(currentEditor.getHTML());
        const serialized = JSON.stringify(currentEditor.getJSON());

        setMarkdownSource(markdown);
        setDocumentValue(serialized);

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(DOC_STORAGE_KEY, serialized);
          }
        } catch {
          // Ignore storage write errors.
        }
      },
    },
    [isEditorReady],
  );

  const richTextMarkdown = richTextHtmlToMarkdown(editor?.getHTML() ?? '');

  const activeMarkdown =
    inputMode === 'markdown' ? markdownSource : richTextMarkdown;

  const normalHtml = useMemo(
    () => markdownToHtml(activeMarkdown),
    [activeMarkdown],
  );

  const outputText = useMemo(() => {
    if (outputMode === 'inline') return toInlineHtml(normalHtml);
    return normalHtml;
  }, [normalHtml, outputMode]);

  const copyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="relative min-h-screen text-foreground">
      <section className="relative mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-5 pb-14 pt-8 sm:px-8 sm:pt-10">
        <PageHeader
          icon={FileCode2}
          title="Markdown Playground"
          description="Compose rich text and instantly export clean Markdown."
          colorScheme={{
            accent: PROJECT_COLOR_SCHEMES.tools.accentColor,
            spotlight: PROJECT_COLOR_SCHEMES.tools.secondaryColor,
          }}
        />

        <PlaygroundIntroCard />

        <div className="grid gap-5 lg:grid-cols-2">
          <PlaygroundInputPanel
            editor={editor}
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            markdownSource={markdownSource}
            onMarkdownSourceChange={setMarkdownSource}
          />

          <PlaygroundOutputPanel
            outputMode={outputMode}
            onOutputModeChange={setOutputMode}
            outputText={outputText}
            copied={copied}
            onCopy={copyOutput}
          />
        </div>
      </section>
    </main>
  );
}
