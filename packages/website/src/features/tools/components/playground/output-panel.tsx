import { Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OutputMode } from '@/features/tools/components/playground/constants';

export function PlaygroundOutputPanel({
  outputMode,
  onOutputModeChange,
  outputText,
  copied,
  onCopy,
}: {
  outputMode: OutputMode;
  onOutputModeChange: (mode: OutputMode) => void;
  outputText: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Card className="min-h-[34rem] border-border/80 lg:h-full lg:min-h-0">
      <CardHeader className="gap-3">
        <CardTitle className="text-base">Output (HTML)</CardTitle>

        <Tabs
          value={outputMode}
          onValueChange={(value) => onOutputModeChange(value as OutputMode)}
          className="w-full"
        >
          <TabsList variant="line" className="h-9 w-full justify-start">
            <TabsTrigger value="normal" className="px-3 text-sm">
              Normal
            </TabsTrigger>
            <TabsTrigger value="inline" className="px-3 text-sm">
              Inline
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-3 text-sm">
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="pt-2">
            <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-xs leading-5 text-foreground/85">
              Standard multi-line HTML output with semantic formatting for
              headings, quotes, lists, and code blocks.
            </div>
          </TabsContent>
          <TabsContent value="inline" className="pt-2">
            <div className="rounded-lg border border-[color:color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--suite-primary-light)_22%,var(--muted))] px-3 py-2.5 text-xs leading-5 text-foreground/88 dark:border-[color:color-mix(in_srgb,var(--suite-accent-dark)_26%,var(--border))] dark:bg-[color:color-mix(in_srgb,var(--suite-primary-dark)_20%,var(--muted))]">
              Single-line HTML output. Preserves code blocks without injecting
              <code> &lt;br /&gt; </code> tags inside fenced code content.
            </div>
          </TabsContent>
          <TabsContent value="preview" className="pt-2">
            <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-xs leading-5 text-foreground/85">
              Rendered rich-text preview of your HTML output.
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onCopy}
            disabled={!outputText}
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="size-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex min-h-[29rem] flex-1 rounded-xl border border-border/75 bg-background/70 p-3">
          {outputMode === 'preview' ? (
            <div
              className="prose prose-sm max-w-none overflow-auto text-foreground dark:prose-invert prose-headings:mb-3 prose-headings:mt-0 prose-p:my-2 prose-li:my-1 prose-code:rounded-sm prose-code:bg-foreground/10 prose-code:px-1 prose-code:py-0.5 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-foreground [&_blockquote]:border-l-border/60 [&_blockquote_p:first-of-type::before]:content-none [&_blockquote_p:last-of-type::after]:content-none [&_code::before]:content-none [&_code::after]:content-none"
              dangerouslySetInnerHTML={{
                __html: outputText || '<p>HTML output will appear here.</p>',
              }}
            />
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap break-words text-[0.92rem] leading-6 text-foreground/95">
              <code>{outputText || 'HTML output will appear here.'}</code>
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
