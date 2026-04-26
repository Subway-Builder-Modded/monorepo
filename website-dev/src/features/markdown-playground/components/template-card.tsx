import { BadgeCheck } from "lucide-react";
import { resolveLucideIcon } from "@/features/content/lib/icon-resolver";
import type { RegistryTemplate } from "@/lib/registry/templates";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
  template: RegistryTemplate;
  onSelect: (template: RegistryTemplate) => void;
};

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getThumbnailStyle(slug: string): React.CSSProperties {
  const seed = hashSeed(slug);
  const hueA = seed % 360;
  const hueB = (seed + 70) % 360;
  const hueC = (seed + 150) % 360;

  return {
    backgroundImage: `radial-gradient(circle at 10% 15%, hsl(${hueA} 75% 42% / 0.45), transparent 56%), radial-gradient(circle at 88% 80%, hsl(${hueB} 70% 52% / 0.42), transparent 54%), linear-gradient(145deg, hsl(${hueC} 28% 16%), hsl(${hueA} 24% 12%))`,
  };
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const Icon = resolveLucideIcon(template.icon);

  return (
    <button
      type="button"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/65 bg-card/85 text-left shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--suite-accent-light)_52%,transparent)] hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--suite-accent-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      onClick={() => onSelect(template)}
      data-testid={`template-card-${template.slug}`}
      aria-label={`Use template ${template.title}`}
    >
      <div
        className="relative h-32 overflow-hidden border-b border-border/60"
        style={getThumbnailStyle(template.slug)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,8,14,0.55),transparent_60%)]" />
        <div className="absolute left-4 top-4 rounded-xl border border-white/20 bg-black/35 p-2 text-white/90 backdrop-blur-sm">
          <Icon className="size-5" aria-hidden={true} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="text-base font-bold tracking-tight text-foreground">{template.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            {template.author}
            {template.verified ? (
              <span aria-label="Verified author" title="Verified author">
                <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden={true} />
              </span>
            ) : null}
          </span>
          <span>{template.dateUpdated}</span>
        </div>
      </div>
    </button>
  );
}
