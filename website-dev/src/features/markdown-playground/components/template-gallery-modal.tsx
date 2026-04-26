import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@subway-builder-modded/shared-ui";
import { X } from "lucide-react";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { TemplateCard } from "./template-card";

type TemplateGalleryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: RegistryTemplate[];
  onSelectTemplate: (template: RegistryTemplate) => void;
};

export function TemplateGalleryModal({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: TemplateGalleryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 left-0 top-0 z-50 h-dvh w-dvw max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-background p-0"
        aria-describedby="registry-template-gallery-description"
      >
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 px-5 py-4 backdrop-blur md:px-8 md:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-black tracking-tight">Use Template</DialogTitle>
                <DialogDescription
                  id="registry-template-gallery-description"
                  className="max-w-3xl text-sm leading-relaxed text-muted-foreground"
                >
                  Choose a starter MDX template for the Registry playground. Selecting a template
                  opens a confirmation dialog before replacing your current draft.
                </DialogDescription>
              </div>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-border/65 bg-background text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--suite-accent-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => onOpenChange(false)}
                aria-label="Close template gallery"
              >
                <X className="size-4.5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.slug} template={template} onSelect={onSelectTemplate} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
