import { useCallback } from "react";
import { Database, ChevronDown } from "lucide-react";
import { RegistrySearch } from "./registry-search";
import { RegistryTypeToggle } from "./registry-type-toggle";
import {
  REGISTRY_PAGE_TITLE,
  REGISTRY_HERO_DESCRIPTION,
  REGISTRY_BROWSE_INDICATOR_LABEL,
} from "@/features/registry/registry-content";

type RegistryHeroProps = {
  query: string;
  typeId: string;
  counts?: Record<string, number>;
  onQueryChange: (q: string) => void;
  onTypeChange: (typeId: string) => void;
  onBrowse: () => void;
  onActivateSearch: () => void;
};

export function RegistryHero({
  query,
  typeId,
  counts,
  onQueryChange,
  onTypeChange,
  onBrowse,
  onActivateSearch,
}: RegistryHeroProps) {
  const handleActivate = useCallback(() => {
    onBrowse();
    onActivateSearch();
  }, [onBrowse, onActivateSearch]);

  return (
    <section
      id="registry-hero"
      className="relative flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] flex-col items-center justify-center overflow-visible border-b border-border/45 bg-background"
    >
      {/* Background pattern – depot-style square grid */}
      <div className="pointer-events-none absolute -top-12 inset-x-0 bottom-0" aria-hidden={true}>
        {/* Route map background */}
        <img
          src="/assets/geojson/SHA.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 dark:opacity-25 [filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-light)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-light)_50%,transparent))] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-dark)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-dark)_50%,transparent))]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent),transparent_58%)] dark:bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-dark)_28%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px)] bg-[length:100%_100%,56px_56px,56px_56px] dark:bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-5 sm:px-7">
        <div className="space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="inline-flex items-center justify-center gap-3 text-[clamp(2.8rem,7vw,5.4rem)] font-extrabold tracking-[-0.05em] text-foreground">
              <Database
                className="size-[0.85em] text-[var(--suite-accent-light)] drop-shadow-[0_0_1.35rem_color-mix(in_srgb,var(--suite-accent-light)_36%,transparent)] dark:text-[var(--suite-accent-dark)] dark:drop-shadow-[0_0_1.6rem_color-mix(in_srgb,var(--suite-accent-dark)_46%,transparent)]"
                aria-hidden={true}
              />
              <span>{REGISTRY_PAGE_TITLE}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-[clamp(1rem,1.8vw,1.12rem)] leading-relaxed text-foreground/80 dark:text-foreground/82">
              {REGISTRY_HERO_DESCRIPTION}
            </p>
          </div>

          {/* Search bar – hero centerpiece */}
          <div className="mx-auto w-full max-w-3xl space-y-3">
            <RegistrySearch
              query={query}
              onChange={onQueryChange}
              onActivate={handleActivate}
              className="w-full"
              inputClassName="h-16 rounded-[1.65rem] border-white/52 bg-white/72 shadow-[0_18px_42px_rgba(88,28,135,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-black/24 dark:shadow-[0_18px_48px_rgba(10,8,20,0.42)]"
            />

            {/* Type toggle, positioned below the search bar */}
            <div className="relative z-20 flex justify-center">
              <RegistryTypeToggle
                activeTypeId={typeId}
                onChange={onTypeChange}
                counts={counts}
                className="border-white/68 bg-white/86 shadow-[0_14px_32px_rgba(88,28,135,0.1)] ring-1 ring-white/50 backdrop-blur-xl dark:border-white/18 dark:bg-black/46 dark:shadow-[0_16px_36px_rgba(10,8,20,0.5)] dark:ring-white/12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suite-colored strip at bottom of hero */}
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]"
        aria-hidden={true}
      />

      {/* Browse indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={onBrowse}
          className="group flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-muted-foreground/70 transition-all duration-200 hover:scale-105 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          <span className="text-xs font-medium tracking-wide">
            {REGISTRY_BROWSE_INDICATOR_LABEL}
          </span>
          <ChevronDown
            className="size-4 transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none"
            aria-hidden={true}
          />
        </button>
      </div>
    </section>
  );
}
