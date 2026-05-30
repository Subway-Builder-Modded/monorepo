import { BadgeCheck } from "lucide-react";
import {
  DirectoryCard,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
  template: RegistryTemplate;
  onSelect: (template: RegistryTemplate) => void;
};

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = resolveIcon(template.icon);

  return (
    <DirectoryCard
      asChild
      alignment="top"
      icon={
        <span data-testid={`template-card-icon-stage-${template.slug}`} className="inline-flex">
          <Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />
        </span>
      }
      heading={
        <span className="inline-flex items-center gap-2">
          <span className="text-base font-semibold leading-tight md:text-lg">{template.title}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-400">
                  {template.latestVersion}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-[140]">
                Latest Version
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      }
      description={
        <span className="space-y-1">
          <span className="block text-[13px] leading-5 text-muted-foreground">
            {template.verified ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1.5">
                      <span>{template.author}</span>
                      <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden={true} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[140]">
                    Verified
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span>{template.author}</span>
            )}
          </span>
          <span className="line-clamp-2 block">{template.description}</span>
        </span>
      }
      descriptionClassName="text-xs"
      className={cn(
        "h-full border-border/65 bg-card/85 text-left shadow-sm",
        "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_52%,transparent)]",
      )}
      data-testid={`template-card-${template.slug}`}
    >
      <button
        type="button"
        onClick={() => onSelect(template)}
        className="block w-full rounded-xl focus-visible:outline-none"
      >
        {null}
      </button>
    </DirectoryCard>
  );
}
