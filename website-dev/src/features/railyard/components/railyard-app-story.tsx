import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  SectionHeader,
  SectionShell,
} from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import { railyardProductStory } from "@/features/railyard/railyard-content";
import { railyardStorySteps } from "@/features/railyard/railyard-assets";

export function RailyardAppStory() {
  const [selectedId, setSelectedId] = useState(railyardStorySteps[0]!.id);
  const selectedStep =
    railyardStorySteps.find((step) => step.id === selectedId) ?? railyardStorySteps[0]!;

  return (
    <SectionShell>
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="lg:col-span-2">
          <SectionHeader
            title={railyardProductStory.title}
            description={railyardProductStory.description}
          />
        </div>
        <Card className="h-full overflow-hidden rounded-2xl border-border/50 bg-card/80 py-0 shadow-md">
          <CardContent className="h-full p-0">
            <div className="relative h-full min-h-64 sm:min-h-72 lg:min-h-[26rem] xl:min-h-[30rem]">
              <img
                src={selectedStep.imageLight}
                alt={selectedStep.imageAlt}
                className="absolute inset-0 block size-full object-cover object-center dark:hidden"
              />
              <img
                src={selectedStep.imageDark}
                alt={selectedStep.imageAlt}
                className="absolute inset-0 hidden size-full object-cover object-center dark:block"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid w-full min-w-0 max-w-none gap-2.5 content-start lg:h-full lg:grid-rows-3">
          {railyardStorySteps.map((step) => {
            const isSelected = step.id === selectedStep.id;
            const Icon = resolveIcon(step.icon);

            return (
              <Button
                key={step.id}
                type="button"
                variant={isSelected ? "secondary" : "ghost"}
                className="!flex min-h-30 h-auto w-full min-w-0 max-w-full !whitespace-normal overflow-hidden items-center justify-start rounded-xl border border-border/50 px-4.5 py-4.5 text-left transition-all hover:border-border/70 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 lg:h-full"
                onClick={() => setSelectedId(step.id)}
                aria-pressed={isSelected}
              >
                <span className="flex w-full min-w-0 items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col justify-center space-y-1.5">
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4.5 shrink-0 text-foreground" aria-hidden={true} />
                      <span className="block max-w-full break-words [overflow-wrap:anywhere] text-[1.05rem] font-semibold leading-snug text-foreground sm:text-lg">
                        {step.title}
                      </span>
                    </span>
                    <span className="block max-w-full break-words [overflow-wrap:anywhere] pl-7 text-[0.95rem] font-normal leading-relaxed text-muted-foreground sm:text-base">
                      {step.description}
                    </span>
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
