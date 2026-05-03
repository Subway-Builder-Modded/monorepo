import { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { BadgeCheck, BookText, Eye, Sparkles, X } from "lucide-react";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { resolveIcon } from "@subway-builder-modded/icons";
import { getSuiteAccentStyle } from "@subway-builder-modded/shared-ui";
import type { SuiteAccent } from "@subway-builder-modded/shared-ui";
import type { RegistryTemplate, RegistryTemplateVersion } from "@/lib/registry/templates";
import { TemplateCard } from "./template-card";
import { TemplateVersionList } from "./template-version-list";
import { cn } from "@/lib/utils";
import { UTILITY_ACTION_BUTTON_CLASS } from "@/features/content/components/utility-action";

type TemplateGalleryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: RegistryTemplate[];
  onInsertTemplate: (markdown: string) => void;
  accent?: SuiteAccent;
};

type CachedTemplateModalState = {
  selectedTemplateSlug: string | null;
  previewVersionId: string | null;
  previewBreadcrumb: string;
};

const TEMPLATE_MODAL_STATE_KEY = "markdown-playground:template-modal-state";

/** Which screen is currently shown inside the modal. */
type ModalScreen = "gallery" | "listing" | "preview";

function VerifiedBadge() {
  return <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden />;
}

function stripHeadingHashLinks(html: string): string {
  if (!html || typeof window === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const headingAnchors = doc.body.querySelectorAll(
    "h2 > a[href^='#'], h3 > a[href^='#'], h4 > a[href^='#'], h5 > a[href^='#']",
  );

  for (const anchor of headingAnchors) {
    const heading = anchor.parentElement;
    if (!heading) {
      continue;
    }

    const preservedChildren = Array.from(anchor.childNodes).filter((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return true;
      }

      const element = node as Element;
      return element.tagName.toLowerCase() !== "svg";
    });

    heading.replaceChildren(...preservedChildren.map((node) => node.cloneNode(true)));
  }

  return doc.body.innerHTML;
}

function trimTemplateBody(body: string | null | undefined): string {
  if (typeof body !== "string") {
    return "";
  }

  if (!body) {
    return "";
  }

  const withoutLeadingBlankLines = body.replace(/^(?:[ \t]*\r?\n)+/, "");
  return withoutLeadingBlankLines.replace(/(?:\r?\n[ \t]*)+$/, "");
}

export function TemplateGalleryModal({
  open,
  onOpenChange,
  templates,
  onInsertTemplate,
  accent,
}: TemplateGalleryModalProps) {
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<RegistryTemplateVersion | null>(null);
  const [previewBreadcrumb, setPreviewBreadcrumb] = useState("Preview");
  const [listingHtml, setListingHtml] = useState("");

  const screen: ModalScreen =
    selectedTemplateSlug === null ? "gallery" : previewVersion ? "preview" : "listing";

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === selectedTemplateSlug) ?? null,
    [selectedTemplateSlug, templates],
  );

  const latestVersion = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }
    return (
      selectedTemplate.versions.find(
        (version) => version.version === selectedTemplate.latestVersion,
      ) ??
      selectedTemplate.versions[0] ??
      null
    );
  }, [selectedTemplate]);

  const normalizedPreviewBody = useMemo(
    () => (previewVersion ? trimTemplateBody(previewVersion.body) : ""),
    [previewVersion],
  );

  // Restore state on open so the modal can reopen where the user left off.
  useEffect(() => {
    if (open) {
      if (typeof window === "undefined") {
        return;
      }

      const rawState = window.localStorage.getItem(TEMPLATE_MODAL_STATE_KEY);
      if (!rawState) {
        return;
      }

      let parsed: CachedTemplateModalState;
      try {
        parsed = JSON.parse(rawState) as CachedTemplateModalState;
      } catch {
        return;
      }

      const cachedSlug = parsed.selectedTemplateSlug;
      if (!cachedSlug) {
        return;
      }

      const cachedTemplate = templates.find((template) => template.slug === cachedSlug);
      if (!cachedTemplate) {
        return;
      }

      setSelectedTemplateSlug(cachedTemplate.slug);

      const cachedPreviewVersion =
        cachedTemplate.versions.find((version) => version.id === parsed.previewVersionId) ?? null;

      if (!cachedPreviewVersion) {
        setPreviewVersion(null);
        setPreviewBreadcrumb("Preview");
        return;
      }

      setPreviewVersion(cachedPreviewVersion);
      setPreviewBreadcrumb(parsed.previewBreadcrumb || "Preview");
    }
  }, [open, templates]);

  // Persist current navigation state so reopening returns to the previous screen.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const state: CachedTemplateModalState = {
      selectedTemplateSlug,
      previewVersionId: previewVersion?.id ?? null,
      previewBreadcrumb,
    };

    window.localStorage.setItem(TEMPLATE_MODAL_STATE_KEY, JSON.stringify(state));
  }, [selectedTemplateSlug, previewVersion, previewBreadcrumb]);

  useEffect(() => {
    if (screen !== "listing" || !selectedTemplate) {
      setListingHtml("");
      return;
    }
    void renderPlaygroundHtml(
      selectedTemplate.descriptionBody || "_No page content available._",
    ).then((result) => {
      setListingHtml(stripHeadingHashLinks(result.html));
    });
  }, [screen, selectedTemplate]);

  const openListing = (template: RegistryTemplate) => {
    setSelectedTemplateSlug(template.slug);
    setPreviewVersion(null);
  };

  const backToGallery = () => {
    setSelectedTemplateSlug(null);
    setPreviewVersion(null);
  };

  const backToListing = () => {
    setPreviewVersion(null);
    setPreviewBreadcrumb("Preview");
  };

  const useVersion = (version: RegistryTemplateVersion) => {
    onInsertTemplate(trimTemplateBody(version.body));
    onOpenChange(false);
  };

  const openPreviewForVersion = (version: RegistryTemplateVersion, breadcrumb: string) => {
    setPreviewVersion(version);
    setPreviewBreadcrumb(breadcrumb);
  };

  const openLatestPreview = () => {
    if (!latestVersion) return;
    openPreviewForVersion(latestVersion, "Preview");
  };

  const onVersionPreview = (version: RegistryTemplateVersion) => {
    // Always route version-row actions through preview to avoid accidental direct inserts.
    openPreviewForVersion(version, `Preview (${version.version})`);
  };

  const headerDesc =
    screen === "gallery"
      ? "Browse templates, inspect details, and insert one into the editor."
      : "Read the description, then choose a version to use below.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={getSuiteAccentStyle(accent)}
        className={cn(
          "!fixed !inset-3 !left-auto !top-auto !z-[121] !flex !h-auto !w-auto !max-w-none !translate-x-0 !translate-y-0 !flex-col !gap-0 !overflow-hidden !rounded-2xl border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--suite-accent-light)_8%,transparent),transparent_32%),var(--background)] p-0 shadow-2xl outline-none",
          "md:!inset-4 lg:!inset-8",
        )}
        data-testid="registry-template-modal-panel"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="shrink-0 border-b border-border/70 bg-background/88 px-5 py-4 backdrop-blur md:px-7 md:py-5">
          <div
            className={cn(
              "flex justify-between gap-4",
              screen === "gallery" ? "items-start" : "items-center",
            )}
          >
            <div className="min-w-0 space-y-1.5">
              {/* Breadcrumb */}
              {screen !== "gallery" ? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <button
                          type="button"
                          onClick={backToGallery}
                          className="text-muted-foreground transition-colors hover:!text-[var(--suite-accent-light)] focus-visible:!text-[var(--suite-accent-light)]"
                        >
                          Browse Templates
                        </button>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {screen === "listing" ? (
                        <BreadcrumbPage>{selectedTemplate?.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <button
                            type="button"
                            onClick={backToListing}
                            className="text-muted-foreground transition-colors hover:!text-[var(--suite-accent-light)] focus-visible:!text-[var(--suite-accent-light)]"
                          >
                            {selectedTemplate?.title}
                          </button>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {screen === "preview" ? (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{previewBreadcrumb}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : null}
                  </BreadcrumbList>
                </Breadcrumb>
              ) : null}

              {screen === "gallery" ? (
                <>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                    <span className="inline-flex items-center gap-2">
                      Browse Templates
                      <a
                        href="/registry/docs/markdown-playground"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-muted-foreground transition-colors hover:text-[var(--suite-accent-light)]"
                      >
                        <BookText className="size-4" aria-hidden />
                      </a>
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    {headerDesc}
                  </DialogDescription>
                </>
              ) : (
                <>
                  <DialogTitle>
                    {screen === "preview" ? previewBreadcrumb : selectedTemplate?.title}
                  </DialogTitle>
                  <DialogDescription>
                    {screen === "preview"
                      ? `Previewing ${previewVersion?.version ?? "latest"} template version`
                      : `${selectedTemplate?.title} template`}
                  </DialogDescription>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/65 bg-background text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--suite-accent-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div
          className={cn(
            "min-h-0 flex-1",
            screen === "preview"
              ? "overflow-hidden p-0"
              : "overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-7 md:py-6",
          )}
        >
          {/* Screen: Gallery */}
          {screen === "gallery" ? (
            templates.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-card/50 px-6 py-10 text-center">
                <p className="text-lg font-semibold text-foreground">No templates found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add templates under{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    content/registry/templates/&lt;slug&gt;/
                  </code>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard key={template.slug} template={template} onSelect={openListing} />
                ))}
              </div>
            )
          ) : null}

          {/* Screen: Listing */}
          {screen === "listing" && selectedTemplate ? (
            <div className="space-y-6" data-testid="template-listing-screen">
              {/* Identity card */}
              <section className="rounded-2xl border border-border/70 bg-card/65 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--suite-accent-light)_42%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] text-[var(--suite-accent-light)]">
                      {(() => {
                        const Icon = resolveIcon(selectedTemplate.icon);
                        return <Icon className="size-7" aria-hidden />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-foreground">
                        {selectedTemplate.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedTemplate.verified ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1.5">
                                  <span>{selectedTemplate.author}</span>
                                  <VerifiedBadge />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="z-[140]">
                                Verified
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          selectedTemplate.author
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                    <button
                      type="button"
                      className={UTILITY_ACTION_BUTTON_CLASS}
                      onClick={openLatestPreview}
                      data-testid="template-preview-latest"
                    >
                      <Eye className="size-3" aria-hidden />
                      Preview Template
                    </button>
                    <button
                      type="button"
                      className={UTILITY_ACTION_BUTTON_CLASS}
                      onClick={() => {
                        if (latestVersion) useVersion(latestVersion);
                      }}
                      data-testid="template-use-latest"
                    >
                      <Sparkles className="size-3" aria-hidden />
                      Use Template
                    </button>
                  </div>
                </div>
              </section>

              <article className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-6">
                <div
                  className="prose-docs max-w-none"
                  dangerouslySetInnerHTML={{ __html: listingHtml }}
                />
              </article>

              {/* Version list */}
              <TemplateVersionList
                versions={selectedTemplate.versions}
                onPreviewVersion={onVersionPreview}
              />
            </div>
          ) : null}

          {/* Screen: Preview */}
          {screen === "preview" && selectedTemplate && previewVersion ? (
            <div className="h-full p-4 md:p-5 lg:p-6" data-testid="template-preview-screen">
              <article className="group relative h-full overflow-hidden rounded-lg border border-border/50 bg-card/95">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => useVersion(previewVersion)}
                        className={cn(
                          "absolute right-5 top-4 z-10 inline-flex h-[clamp(2.25rem,4vw,2.9rem)] w-[clamp(2.25rem,4vw,2.9rem)] items-center justify-center rounded-md transition-all md:right-6 md:top-5 lg:right-7",
                          "opacity-90 md:opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                          "bg-foreground/10 hover:bg-foreground/20 text-foreground/60 hover:text-foreground/90",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                        data-testid="template-preview-use"
                      >
                        <Sparkles className="size-[clamp(0.9rem,1.7vw,1.15rem)]" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="z-[140]">
                      Use Template
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <ScrollArea className="h-full">
                  <pre className="min-h-full p-4 pr-14 md:pr-16 text-sm leading-6 text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    <code>{normalizedPreviewBody}</code>
                  </pre>
                </ScrollArea>
              </article>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
