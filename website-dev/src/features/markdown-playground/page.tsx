import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Code,
  Code2,
  Copy,
  Eye,
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
  PenLine,
  Quote,
  BookDashed,
  Strikethrough,
} from "lucide-react";
import {
  Button,
  Card,
  PageHeading,
  SuiteAccentScope,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { getRegistryTemplates } from "@/lib/registry/templates";
import { matchMarkdownPlaygroundRoute } from "@/features/markdown-playground/lib/routing";
import { DEFAULT_MARKDOWN, usePlaygroundStorage } from "@/features/markdown-playground/lib/storage";
import type { ToolbarActionId } from "@/features/markdown-playground/lib/toolbar-actions";
import { applyToolbarAction } from "@/features/markdown-playground/lib/toolbar-actions";
import {
  renderPlaygroundHtml,
  renderPlainHtml,
} from "@/features/markdown-playground/lib/mdx-runtime";
import { copyPlaygroundContent } from "@/features/markdown-playground/lib/copy-playground-content";
import { TemplateGalleryModal } from "./components/template-gallery-modal";
import { cn } from "@/lib/utils";
import { UTILITY_ACTION_BUTTON_CLASS } from "@/features/content/components/utility-action";

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
  const [renderedHtml, setRenderedHtml] = useState<string>("<p>Loading preview...</p>");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const autosizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

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
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [content]);

  useEffect(() => {
    autosizeTextarea();
  }, [content]);

  if (match.kind !== "page") {
    return null;
  }

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion
          className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground"
          aria-hidden
        />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">
          Page Not Found
        </h1>
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
    const html = await renderPlainHtml(content);
    await writeClipboard(html, "copied-html");
  };

  const markdownTooltip =
    copyFeedback === "copied-markdown"
      ? "Copied!"
      : copyFeedback === "copy-failed"
        ? "Copy failed"
        : "Copy Markdown";

  const htmlTooltip =
    copyFeedback === "copied-html"
      ? "Copied!"
      : copyFeedback === "copy-failed"
        ? "Copy failed"
        : "Copy HTML";

  const onModeChange = (value: string) => {
    if (value === "markdown" || value === "rich") {
      setMode(value);
    }
  };

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        <PageHeading
          icon={Icon}
          title={navItem.title}
          description={navItem.description}
          actions={
            <button
              type="button"
              className={UTILITY_ACTION_BUTTON_CLASS}
              onClick={() => setTemplateGalleryOpen(true)}
              data-testid="playground-use-template"
            >
              <BookDashed className="size-3" aria-hidden="true" />
              Browse Templates
            </button>
          }
        />

        {templateError ? (
          <div
            className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {templateError}
          </div>
        ) : null}

        <Card
          className="!gap-0 !py-0 overflow-hidden rounded-2xl border border-border/70 bg-card/75 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.75)]"
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
                  <TooltipProvider key={action.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => applyAction(action.id)}
                          aria-label={action.label}
                          className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                          data-testid={`toolbar-action-${action.id}`}
                        >
                          <ActionIcon aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="z-[140]">
                        {action.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                <ToggleGroupItem
                  value="markdown"
                  aria-label="Markdown mode"
                  data-testid="mode-markdown"
                >
                  <PenLine className="size-3.5" aria-hidden="true" />
                  Edit
                </ToggleGroupItem>
                <ToggleGroupItem value="rich" aria-label="Rich Text mode" data-testid="mode-rich">
                  <Eye className="size-3.5" aria-hidden="true" />
                  Preview
                </ToggleGroupItem>
              </ToggleGroup>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={copyMarkdown}
                      aria-label="Copy Markdown"
                      className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                      data-testid="copy-markdown"
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="z-[140]">
                    {markdownTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={copyHtml}
                      aria-label="Copy HTML"
                      className="border border-transparent hover:border-border/80 hover:bg-muted/60"
                      data-testid="copy-html"
                    >
                      <Code2 aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="z-[140]">
                    {htmlTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span aria-live="polite" role="status" className="sr-only">
                {copyFeedback !== "idle"
                  ? copyFeedback === "copy-failed"
                    ? "Copy failed"
                    : "Copied"
                  : ""}
              </span>
            </div>
          </div>

          <div data-testid="playground-content-region" dir="ltr">
            {mode === "markdown" ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  autosizeTextarea();
                }}
                onSelect={onSelectionChange}
                onKeyUp={onSelectionChange}
                onClick={onSelectionChange}
                dir="ltr"
                spellCheck={true}
                className={cn(
                  "min-h-[56vh] w-full resize-none overflow-hidden border-0 bg-transparent px-4 py-4 font-mono text-[14px] leading-6 text-foreground",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                )}
                placeholder="Write Markdown here..."
                data-testid="playground-markdown-input"
                aria-label="Markdown editor"
              />
            ) : (
              <div
                dir="ltr"
                className="prose prose-invert min-h-[56vh] max-w-none px-4 py-4"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                data-testid="playground-rich-input"
                aria-label="Rich text preview"
              />
            )}
          </div>
        </Card>

        <TemplateGalleryModal
          open={templateGalleryOpen}
          onOpenChange={setTemplateGalleryOpen}
          templates={templates}
          accent={suite.accent}
          onInsertTemplate={(nextMarkdown) => {
            setContent(nextMarkdown || DEFAULT_MARKDOWN);
            setMode("markdown");
          }}
        />
      </section>
    </SuiteAccentScope>
  );
}
