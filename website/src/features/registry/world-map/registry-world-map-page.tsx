import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import { WorldMap } from "./world-map";

export function RegistryWorldMapPage() {
  const suite = getSuiteById("registry");
  const [items, setItems] = useState<RegistrySearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    loadRegistryItemsForType("maps", "maps")
      .then((loadedItems) => {
        if (!cancelled) setItems(loadedItems);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        <FeatureHomepageHeading
          icon={Globe}
          title="World Map"
          description="Interactively explore all of the user-submitted maps available on Railyard."
          suiteId="registry"
        />

        <div className="mt-[clamp(0.85rem,2vw,1.35rem)] overflow-hidden rounded-2xl border border-border/60 bg-card/55 p-1.5 shadow-sm sm:p-2 lg:p-3">
          <div className="h-[min(78svh,calc(100svh-12.5rem))] min-h-80 w-full overflow-hidden rounded-xl sm:min-h-96">
            <WorldMap items={items} />
          </div>
        </div>
      </section>
    </SuiteAccentScope>
  );
}
