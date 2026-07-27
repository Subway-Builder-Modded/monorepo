import { useEffect, useState, type CSSProperties } from "react";
import { Globe } from "lucide-react";
import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
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
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <div
        className="relative isolate w-full px-5 pb-24 pt-[clamp(3.75rem,6.5vh,5.75rem)] sm:px-7 md:px-9 lg:px-12"
        style={
          {
            "--registry-type-accent": "var(--suite-accent-light)",
            "--registry-type-accent-strong": "var(--suite-accent-light)",
          } as CSSProperties
        }
      >
        <div className="space-y-6">
          <div
            className="flex min-h-24 items-center justify-center rounded-2xl px-5 py-6 text-center"
            style={{
              background: `light-dark(
                color-mix(in srgb, ${suite.accent.light} 10%, transparent),
                color-mix(in srgb, ${suite.accent.dark} 8%, transparent)
              )`,
              border: `1.5px solid light-dark(
                color-mix(in srgb, ${suite.accent.light} 16%, transparent),
                color-mix(in srgb, ${suite.accent.dark} 12%, transparent)
              )`,
            }}
          >
            <div className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <Globe
                  className="size-8 shrink-0 text-(--suite-accent-light) sm:size-9"
                  aria-hidden={true}
                />
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  World Map
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Interactively explore all of the user-submitted maps available on Railyard.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/55 p-1.5 shadow-sm sm:p-2 lg:p-3">
            <div className="h-[min(78svh,calc(100svh-12.5rem))] min-h-80 w-full overflow-hidden rounded-xl sm:min-h-96">
              <WorldMap items={items} />
            </div>
          </div>
        </div>
      </div>
    </SuiteAccentScope>
  );
}
