import { LightMarkdown } from "@/features/content/components/light-markdown";

type DescriptionTabProps = {
  description: string;
};

export function DescriptionTab({ description }: DescriptionTabProps) {
  if (!description.trim()) {
    return (
      <p className="text-sm text-muted-foreground">No description is available for this project.</p>
    );
  }

  return (
    <LightMarkdown className="prose prose-neutral max-w-none text-sm leading-7 prose-headings:font-semibold prose-a:text-[var(--registry-type-accent)]">
      {description}
    </LightMarkdown>
  );
}
