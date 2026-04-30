import { Card, CardContent, SectionHeader, SectionShell } from "@subway-builder-modded/shared-ui";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { resolveIcon } from "@subway-builder-modded/icons";
import {
  TEMPLATE_MOD_DIRECTORY_TREE,
  TEMPLATE_MOD_FOUNDATION_CARDS,
} from "@/features/template-mod/template-mod-content";
import { TemplateModDirectoryTree } from "@/features/template-mod/components/template-mod-directory-tree";

export function TemplateModFoundationGrid() {
  return (
    <SectionShell>
      <SectionHeader
        title="Project Foundation"
        description={
          <LightMarkdown>
            The Template Mod provides development essentials to get your mod up and running.
          </LightMarkdown>
        }
      />

      <div className="mt-7 grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
        <TemplateModDirectoryTree tree={TEMPLATE_MOD_DIRECTORY_TREE} />

        <div className="grid self-start gap-3 sm:grid-cols-2 lg:self-center">
          {TEMPLATE_MOD_FOUNDATION_CARDS.map((card) => {
            const Icon = resolveIcon(card.icon);

            return (
              <Card key={card.id} className="rounded-3xl border-border/55 bg-card/75">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden={true} />
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {card.title}
                      </h3>
                      <LightMarkdown className="text-sm leading-relaxed text-muted-foreground">
                        {card.description}
                      </LightMarkdown>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
