import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolbarButton } from '@/features/tools/components/playground/toolbar-button';
import type { InputMode } from '@/features/tools/components/playground/constants';

export function PlaygroundInputPanel({
  editor,
  inputMode,
  onInputModeChange,
  markdownSource,
  onMarkdownSourceChange,
}: {
  editor: Editor | null;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  markdownSource: string;
  onMarkdownSourceChange: (value: string) => void;
}) {
  const [, setSelectionVersion] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const refreshToolbarState = () => {
      setSelectionVersion((prev) => prev + 1);
    };

    editor.on('selectionUpdate', refreshToolbarState);
    editor.on('transaction', refreshToolbarState);

    return () => {
      editor.off('selectionUpdate', refreshToolbarState);
      editor.off('transaction', refreshToolbarState);
    };
  }, [editor]);

  const active = {
    bold: !!editor?.isActive('bold'),
    italic: !!editor?.isActive('italic'),
    underline: !!editor?.isActive('underline'),
    bulletList: !!editor?.isActive('bulletList'),
    orderedList: !!editor?.isActive('orderedList'),
    blockquote: !!editor?.isActive('blockquote'),
    code: !!editor?.isActive('code'),
    codeBlock: !!editor?.isActive('codeBlock'),
    h1: !!editor?.isActive('heading', { level: 1 }),
    h2: !!editor?.isActive('heading', { level: 2 }),
    h3: !!editor?.isActive('heading', { level: 3 }),
  };

  return (
    <Card className="min-h-[34rem] border-border/80 lg:h-full lg:min-h-0">
      <CardHeader className="gap-3">
        <CardTitle className="text-base">Input</CardTitle>
        <Tabs
          value={inputMode}
          onValueChange={(value) => onInputModeChange(value as InputMode)}
          className="w-full"
        >
          <TabsList variant="line" className="h-9 w-full justify-start">
            <TabsTrigger value="rich-text" className="px-3 text-sm">
              Rich Text
            </TabsTrigger>
            <TabsTrigger value="markdown" className="px-3 text-sm">
              Markdown
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rich-text" className="pt-2">
            <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-xs leading-5 text-foreground/85">
              Format content visually with toolbar controls.
            </div>
          </TabsContent>
          <TabsContent value="markdown" className="pt-2">
            <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-xs leading-5 text-foreground/85">
              Edit markdown source directly. This can be converted to inline
              markdown for use in Railyard submissions.
            </div>
          </TabsContent>
        </Tabs>

        {inputMode === 'rich-text' ? (
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              title="Bold"
              active={active.bold}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={active.italic}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={active.underline}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Bullet List"
              active={active.bulletList}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered List"
              active={active.orderedList}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Quote"
              active={active.blockquote}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Inline code"
              active={active.code}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              <Code2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Code block (``` )"
              active={active.codeBlock}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            >
              <span className="font-mono text-[0.68rem] font-semibold">
                ```
              </span>
            </ToolbarButton>
            <ToolbarButton
              title="Heading 1"
              active={active.h1}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 2"
              active={active.h2}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              active={active.h3}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Undo"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
            >
              <Undo2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Redo"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
            >
              <Redo2 className="size-4" />
            </ToolbarButton>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1">
        <div className="flex min-h-[29rem] w-full flex-1 rounded-xl border border-border/75 bg-background/70 shadow-inner shadow-black/5">
          {inputMode === 'rich-text' ? (
            <EditorContent
              editor={editor}
              className="flex w-full [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-[29rem] [&_.ProseMirror]:w-full [&_.ProseMirror]:font-sans [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:text-[0.97rem] [&_.ProseMirror]:leading-7 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-3 [&_.ProseMirror_blockquote]:border-primary/55 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:font-mono"
            />
          ) : (
            <Textarea
              value={markdownSource}
              onChange={(event) => onMarkdownSourceChange(event.target.value)}
              className="min-h-[29rem] resize-none border-0 bg-transparent px-4 py-3 font-mono text-[0.92rem] leading-6 shadow-none focus-visible:ring-0"
              placeholder="Type markdown here..."
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
