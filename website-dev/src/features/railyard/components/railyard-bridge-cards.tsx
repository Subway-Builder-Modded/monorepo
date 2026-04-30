import { BookText, TrainTrack, Database } from "lucide-react";
import {
  Card,
  CardContent,
  SectionHeader,
  SectionShell,
  SuiteAccentButton,
  SuiteAccentScope,
} from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { Link } from "@/lib/router";
import { railyardBridgeCards } from "@/features/railyard/railyard-assets";
import { railyardBridge } from "@/features/railyard/railyard-content";

const accentById = {
  "railyard-docs": getSuiteById("railyard").accent,
  "registry-docs": getSuiteById("registry").accent,
} as const;

const ctaLabelById = {
  "railyard-docs": "Player Documentation",
  "registry-docs": "Developer Documentation",
} as const;

const mainIconById = {
  "railyard-docs": TrainTrack,
  "registry-docs": Database,
} as const;

const ctaIconById = {
  "railyard-docs": BookText,
  "registry-docs": BookText,
} as const;

export function RailyardBridgeCards() {
  return (
    <SectionShell surfaced>
      <SectionHeader
        title={railyardBridge.title}
        description={railyardBridge.description}
        className="mb-10 lg:mb-12"
      />

      <div className="space-y-6 lg:space-y-7">
        {[...railyardBridgeCards].reverse().map((card) => {
          const accent =
            accentById[card.id as keyof typeof accentById] ?? getSuiteById("railyard").accent;
          const ctaLabel = ctaLabelById[card.id as keyof typeof ctaLabelById] ?? "Open";
          const MainIcon = mainIconById[card.id as keyof typeof mainIconById] ?? BookText;
          const CtaIcon = ctaIconById[card.id as keyof typeof ctaIconById] ?? BookText;

          return (
            <SuiteAccentScope key={card.id} accent={accent}>
              <Card className="overflow-hidden rounded-2xl border-border/50 bg-card/80 py-0 shadow-md transition-shadow hover:shadow-lg lg:rounded-3xl">
                <CardContent className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(20,20,20,0.92))] p-0">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, color-mix(in srgb, var(--suite-accent-light) 10%, transparent) 0%, color-mix(in srgb, var(--suite-accent-light) 6%, transparent) 44%, color-mix(in srgb, var(--suite-accent-light) 9%, transparent) 100%), radial-gradient(130% 115% at 50% 50%, color-mix(in srgb, var(--suite-accent-light) 7%, transparent) 0%, transparent 76%)",
                    }}
                  />
                  <div className="relative mx-auto flex w-full max-w-none flex-col items-center justify-center gap-4 px-8 py-8 text-center sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white backdrop-blur-sm">
                      <MainIcon className="size-5" aria-hidden={true} />
                    </span>

                    <div className="w-full space-y-3">
                      <h3 className="whitespace-nowrap text-[1.5rem] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[1.8rem]">
                        {card.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-white/76 sm:text-base lg:whitespace-nowrap">
                        {card.description}
                      </p>
                    </div>

                    <SuiteAccentButton
                      tone="outline"
                      asChild
                      className="h-11 w-fit gap-2 px-5 text-sm font-semibold"
                    >
                      <Link to={card.href}>
                        <CtaIcon className="size-4" aria-hidden={true} />
                        {ctaLabel}
                      </Link>
                    </SuiteAccentButton>
                  </div>
                </CardContent>
              </Card>
            </SuiteAccentScope>
          );
        })}
      </div>
    </SectionShell>
  );
}
