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
  SuiteAccentButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { BadgeCheck, ExternalLink, Sparkles, X } from "lucide-react";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { resolveLucideIcon } from "@/features/content/lib/icon-resolver";
import { getSuiteAccentStyle } from "@subway-builder-modded/shared-ui";
import type { SuiteAccent } from "@subway-builder-modded/shared-ui";
import type { RegistryTemplate, RegistryTemplateVersion } from "@/lib/registry/templates";
import { TemplateCard } from "./template-card";
import { TemplateVersionList } from "./template-version-list";
import { cn } from "@/lib/utils";

type TemplateGalleryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: RegistryTemplate[];
  onInsertTemplate: (markdown: string) => void;
  accent?: SuiteAccent;
};

/** Which screen is currently shown inside the modal. */
type ModalScreen = "gallery" | "listing";

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

export function TemplateGalleryModal({
  open,
  onOpenChange,
  templates,
  onInsertTemplate,
  accent,
}: TemplateGalleryModalProps) {
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [listingHtml, setListingHtml] = useState("");

  const screen: ModalScreen = selectedTemplateSlug === null ? "gallery" : "listing";

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === selectedTemplateSlug) ?? null,
    [selectedTemplateSlug, templates],
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplateSlug(null);
    }
  }, [open]);

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
  };

  const backToGallery = () => {
    setSelectedTemplateSlug(null);
  };

  const useVersion = (version: RegistryTemplateVersion) => {
    onInsertTemplate(version.body);
    onOpenChange(false);
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
                      <BreadcrumbPage>{selectedTemplate?.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              ) : null}

              {screen === "gallery" ? (
                <>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                    <span className="inline-flex items-center gap-2">
                      Browse Templates
                      <a
                        href="/registry/docs/playground-templates"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Learn more about Browse Templates"
                        className="inline-flex items-center text-muted-foreground transition-colors hover:text-[var(--suite-accent-light)]"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    {headerDesc}
                  </DialogDescription>
                </>
              ) : (
                <>
                  <DialogTitle className="sr-only">{selectedTemplate?.title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {selectedTemplate?.title} template
                  </DialogDescription>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/65 bg-background text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--suite-accent-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => onOpenChange(false)}
              aria-label="Close template gallery"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-7 md:py-6">
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
                        const Icon = resolveLucideIcon(selectedTemplate.icon);
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
                                <span
                                  className="inline-flex items-center gap-1.5"
                                  aria-label="Verified author"
                                >
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
                  <div className="flex shrink-0 items-center gap-2">
                    <SuiteAccentButton
                      tone="solid"
                      className="shrink-0 gap-2"
                      onClick={() => {
                        const latest = selectedTemplate.versions[0];
                        if (latest) useVersion(latest);
                      }}
                      data-testid="template-use-latest"
                    >
                      <Sparkles className="size-4" aria-hidden />
                      Use Template
                    </SuiteAccentButton>
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
              <TemplateVersionList versions={selectedTemplate.versions} onUseVersion={useVersion} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
