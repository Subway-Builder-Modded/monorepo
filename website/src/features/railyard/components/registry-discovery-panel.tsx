import {
  Card,
  CardContent,
  SectionHeader,
  SectionShell,
  SuiteAccentButton,
  SuiteAccentScope,
} from "@subway-builder-modded/shared-ui";
import { Database, Map, Package } from "lucide-react";
import { getSuiteById } from "@/config/site-navigation";
import { Link } from "@/lib/router";
import { railyardRegistryPreviewImage } from "@/features/railyard/railyard-assets";
import { railyardRegistryDiscovery } from "@/features/railyard/railyard-content";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

type RegistryDiscoveryPanelProps = {
  summary: RailyardRegistrySummary;
};

const registrySuite = getSuiteById("registry");

export function RegistryDiscoveryPanel({ summary }: RegistryDiscoveryPanelProps) {
  return (
    <SectionShell surfaced>
      <SectionHeader
        title={railyardRegistryDiscovery.title}
        description={railyardRegistryDiscovery.description}
        className="mb-10 lg:mb-12"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-center lg:gap-10">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2.5">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
              <Map className="size-3.5" aria-hidden={true} />
              {summary.mapsCount} Maps
            </span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-3.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
              <Package className="size-3.5" aria-hidden={true} />
              {summary.modsCount} Mods
            </span>
          </div>
          <p className="text-base leading-relaxed text-white/88 sm:text-[17px]">
            Railyard is powered by its GitHub-powered Registry, which hosts all of the data for
            content that you can discover and install in Railyard. The Registry also comes equipped
            with in-depth analytics and insights for creators to see how their content is
            performing.
          </p>
          <SuiteAccentScope accent={registrySuite.accent}>
            <SuiteAccentButton
              tone="solid"
              asChild
              className="h-11 w-fit px-6 text-sm font-semibold"
            >
              <Link to={railyardRegistryDiscovery.ctaHref}>
                <Database className="size-4" aria-hidden={true} />
                {railyardRegistryDiscovery.ctaLabel}
              </Link>
            </SuiteAccentButton>
          </SuiteAccentScope>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/50 bg-card/80 py-0 shadow-md transition-shadow hover:shadow-lg lg:rounded-3xl">
          <CardContent className="p-0">
            <div className="relative aspect-[16/10]">
              <img
                src={railyardRegistryPreviewImage.light}
                alt=""
                className="absolute inset-0 block size-full object-cover object-center dark:hidden"
              />
              <img
                src={railyardRegistryPreviewImage.dark}
                alt=""
                className="absolute inset-0 hidden size-full object-cover object-center dark:block"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  );
}
