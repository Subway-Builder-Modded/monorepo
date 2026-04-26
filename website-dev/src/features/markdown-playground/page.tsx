import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bold,
  Code,
  Copy,
  FileCode2,
  FileQuestion,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sparkles,
  Strikethrough,
  Type,
} from "lucide-react";
import {
  AppDialog,
  Button,
  Card,
  PageHeading,
  SuiteAccentButton,
  SuiteAccentScope,
  ToggleGroup,
  ToggleGroupItem,
} from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { getRegistryTemplates } from "@/lib/registry/templates";
import { matchMarkdownPlaygroundRoute } from "@/features/markdown-playground/lib/routing";
import {
  DEFAULT_MARKDOWN,
  STORAGE_KEYS,
  usePlaygroundStorage,
} from "@/features/markdown-playground/lib/storage";
import type { ToolbarActionId } from "@/features/markdown-playground/lib/toolbar-actions";
import { applyToolbarAction } from "@/features/markdown-playground/lib/toolbar-actions";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { copyPlaygroundContent } from "@/features/markdown-playground/lib/copy-playground-content";
import { TemplateGalleryModal } from "./components/template-gallery-modal";
import { cn } from "@/lib/utils";

type ToolbarAction = {
  id: ToolbarActionId;
  label: string;
  icon: LucideIcon;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { id: "h1", label: "Heading 1", icon: Heading1 },
  { id: "h2", label: "Heading 2", icon: Heading2 },
  { id: "h3", label: "Heading 3", icon: Heading3 },
  { id: "h4", label: "Heading 4", icon: Heading4 },
  { id: "bold", label: "Bold", icon: Bold },
  { id: "italic", label: "Italic", icon: Italic },
  { id: "strike", label: "Strikethrough", icon: Strikethrough },
  { id: "inline-code", label: "Inline code", icon: Code },
  { id: "code-block", label: "Code block", icon: FileCode2 },
  { id: "blockquote", label: "Blockquote", icon: Quote },
  { id: "bullet-list", label: "Bulleted list", icon: List },
  { id: "numbered-list", label: "Numbered list", icon: ListOrdered },
  { id: "link", label: "Insert link", icon: Link2 },
  { id: "image", label: "Insert image", icon: ImageIcon },
  { id: "horizontal-rule", label: "Horizontal rule", icon: Minus },
];

type CopyFeedback = "idle" | "copied-markdown" | "copied-html" | "copy-failed";

function useTemplates() {
  return useMemo(() => {
    try {
      return { templates: getRegistryTemplates(), error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load templates.";
      return { templates: [] as RegistryTemplate[], error: message };
    }
  }, []);
}

export function MarkdownPlaygroundRoute() {
  const location = useLocation();
  const match = matchMarkdownPlaygroundRoute(location.pathname);
  const navItem = getMatchingItem(location.pathname, "registry");
  const { mode, setMode, content, setContent } = usePlaygroundStorage();
  const { templates, error: templateError } = useTemplates();

  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>("idle");
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RegistryTemplate | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>("<p>Loading preview...</p>");
  const [htmlWarning, setHtmlWarning] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setCopyFeedback("idle"), 1400);
    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const result = await renderPlaygroundHtml(content);
      if (!active) {
        return;
      }
      setRenderedHtml(result.html);
      setHtmlWarning(result.warning ?? null);
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [content]);

  if (match.kind !== "page") {
    return null;
  }

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground" aria-hidden />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">Page Not Found</h1>
        <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);

  const onSelectionChange = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    setSelectionStart(textarea.selectionStart);
    setSelectionEnd(textarea.selectionEnd);
  };

  const applyAction = (actionId: ToolbarActionId) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : selectionStart;
    const end = textarea ? textarea.selectionEnd : selectionEnd;

    const result = applyToolbarAction(actionId, content, start, end);
    setContent(result.content);
    setMode("markdown");
    setSelectionStart(result.selectionStart);
    setSelectionEnd(result.selectionEnd);

    window.requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const writeClipboard = async (value: string, successState: CopyFeedback) => {
    try {
      await copyPlaygroundContent(value);
      setCopyFeedback(successState);
    } catch {
      setCopyFeedback("copy-failed");
    }
  };

  const copyMarkdown = async () => {
    await writeClipboard(content, "copied-markdown");
  };

  const copyHtml = async () => {
    const html = renderedHtml || (await renderPlaygroundHtml(content)).html;
    await writeClipboard(html, "copied-html");
  };

  const copyFeedbackLabel =
    copyFeedback === "copied-markdown"
      ? "Markdown copied"
      : copyFeedback === "copied-html"
        ? "HTML copied"
        : copyFeedback === "copy-failed"
          ? "Copy failed"
          : "";

  const onModeChange = (value: string) => {
    if (value === "markdown" || value === "rich") {
      setMode(value);
    }
  };

  const onRichInput = (event: React.FormEvent<HTMLDivElement>) => {
    // Rich mode remains a safe editable shell; Markdown source is still canonical.
    const nextText = event.currentTarget.textContent ?? "";
    setContent(nextText);
  };

  const openTemplateConfirm = (template: RegistryTemplate) => {
    setSelectedTemplate(template);
  };

  const confirmTemplateUsage = () => {
    if (!selectedTemplate) {
      return;
    }

    setContent(selectedTemplate.body || DEFAULT_MARKDOWN);
    setTemplateGalleryOpen(false);
    setSelectedTemplate(null);
    setMode("markdown");
  };

  const closeTemplateConfirm = () => {
    setSelectedTemplate(null);
  };

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/65 bg-background/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Draft and refine Registry MDX content in a single workspace. Your content and mode are
            automatically saved under {STORAGE_KEYS.content}.
          </p>
          <SuiteAccentButton
            tone="solid"
            className="h-10 shrink-0 gap-2 px-4"
            onClick={() => setTemplateGalleryOpen(true)}
            data-testid="playground-use-template"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Use Template
          </SuiteAccentButton>
        </div>

        {templateError ? (
          <div
            className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {templateError}
          </div>
        ) : null}

        <Card
          className="overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.75)]"
          data-testid="markdown-playground-editor-surface"
          dir="ltr"
        >
          <div
            className="flex flex-wrap items-center gap-2 border-b border-border/65 bg-background/55 px-3 py-3 sm:px-4"
            data-testid="markdown-playground-toolbar"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {TOOLBAR_ACTIONS.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.id}
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => applyAction(action.id)}
                    aria-label={action.label}
                    title={action.label}
                    className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                    data-testid={`toolbar-action-${action.id}`}
                  >
                    <ActionIcon aria-hidden="true" />
                  </Button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2" data-testid="toolbar-right-group">
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={onModeChange}
                variant="outline"
                size="sm"
                className="rounded-lg border border-border/70 bg-background/75"
                data-testid="playground-mode-switcher"
              >
                <ToggleGroupItem value="markdown" aria-label="Markdown mode" data-testid="mode-markdown">
                  MD
                </ToggleGroupItem>
                <ToggleGroupItem value="rich" aria-label="Rich Text mode" data-testid="mode-rich">
                  Rich
                </ToggleGroupItem>
              </ToggleGroup>

              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={copyMarkdown}
                aria-label="Copy Markdown"
                title="Copy Markdown"
                className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                data-testid="copy-markdown"
              >
                <Copy aria-hidden="true" />
              </Button>

              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={copyHtml}
                aria-label="Copy HTML"
                title="Copy HTML"
                className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                data-testid="copy-html"
              >
                <Type aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="min-h-[56vh]" data-testid="playground-content-region" dir="ltr">
            {mode === "markdown" ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onSelect={onSelectionChange}
                onKeyUp={onSelectionChange}
                onClick={onSelectionChange}
                dir="ltr"
                spellCheck={true}
                className={cn(
                  "h-[56vh] w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-[14px] leading-6 text-foreground",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                )}
                placeholder="Write Markdown or MDX here..."
                data-testid="playground-markdown-input"
                aria-label="Markdown editor"
              />
            ) : (
              <div
                dir="ltr"
                contentEditable
                suppressContentEditableWarning
                onInput={onRichInput}
                className="prose prose-invert max-w-none h-[56vh] overflow-auto px-4 py-4 focus-visible:outline-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                data-testid="playground-rich-input"
                aria-label="Rich text editor"
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 bg-background/40 px-4 py-2.5 text-xs text-muted-foreground">
            <span>One shared editor surface. Switch mode without opening another panel.</span>
            <span aria-live="polite" role="status">
              {copyFeedbackLabel || htmlWarning || ""}
            </span>
          </div>
        </Card>

        <TemplateGalleryModal
          open={templateGalleryOpen}
          onOpenChange={setTemplateGalleryOpen}
          templates={templates}
          onSelectTemplate={openTemplateConfirm}
        />

        <AppDialog
          open={selectedTemplate != null}
          onOpenChange={(open) => {
            if (!open) {
              closeTemplateConfirm();
            }
          }}
          title="Replace Current Draft"
          icon={AlertTriangle}
          description={
            selectedTemplate
              ? `Using "${selectedTemplate.title}" will replace your current editor content.`
              : "Using this template will replace your current editor content."
          }
          tone="files"
          confirm={{
            label: "Use Template",
            cancelLabel: "Cancel",
            onConfirm: confirmTemplateUsage,
          }}
        >
          <p className="text-sm text-muted-foreground">
            Confirm to replace your draft and persist the selected template body.
          </p>
        </AppDialog>
      </section>
    </SuiteAccentScope>
  );
}
