import { useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";
import { SuiteAccentButton } from "@subway-builder-modded/shared-ui";
import { mdxToMarkdown } from "@/app/features/docs/lib/markdown-copy";

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const markdown = mdxToMarkdown(content);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <SuiteAccentButton tone="outline" onClick={handleCopy} aria-label="Copy page as Markdown">
      {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </SuiteAccentButton>
  );
}

type DocsPageTitleCardProps = {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> | null;
  editUrl: string;
  rawContent?: string | null;
};

export function DocsPageTitleCard({
  title,
  description,
  icon: Icon,
  editUrl,
  rawContent,
}: DocsPageTitleCardProps) {
  return (
    <header className="mb-4 rounded-2xl border-2 border-border/65 bg-background/72 p-4 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.35)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_13%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]">
          {Icon ? <Icon className="size-5" aria-hidden={true} /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SuiteAccentButton asChild tone="outline" className="h-8 gap-1.5 rounded-md px-2">
          <a href={editUrl} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline">
            <Pencil className="size-3" aria-hidden="true" />
            Edit on GitHub
          </a>
        </SuiteAccentButton>
        {rawContent ? <CopyButton content={rawContent} /> : null}
      </div>
    </header>
  );
}
