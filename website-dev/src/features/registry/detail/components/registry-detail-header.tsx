import { Button } from "@subway-builder-modded/shared-ui";
import { ArrowDownToLine, Download, Map, Package, Users } from "lucide-react";
import { getCountryFlagIcon } from "@/lib/country-flags";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

type RegistryDetailHeaderProps = {
  detail: RegistryDetailModel;
  accentColor: string;
  onOpenInRailyard: () => void;
  onOpenImage: (index: number) => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function RegistryDetailHeader({
  detail,
  accentColor,
  onOpenInRailyard,
  onOpenImage,
}: RegistryDetailHeaderProps) {
  const coverImage = detail.galleryImages[0] ?? null;
  const countryCode = detail.mapFields?.countryCode ?? null;
  const CountryFlagIcon = getCountryFlagIcon(countryCode);
  const TypeIcon = detail.typeConfig.id === "maps" ? Map : Package;

  return (
    <header className="space-y-6 pt-3 sm:pt-4">
      <div className="bg-transparent py-2 sm:py-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-stretch">
          {coverImage ? (
            <button
              type="button"
              onClick={() => onOpenImage(0)}
              className="group relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border border-border/70 lg:h-full lg:aspect-square"
              aria-label="Open image gallery"
            >
              <img
                src={coverImage}
                alt={`${detail.name} preview image`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-semibold"
                style={{
                  borderColor: `color-mix(in srgb, ${accentColor} 34%, transparent)`,
                  background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
                  color: accentColor,
                }}
              >
                <TypeIcon className="size-4" aria-hidden={true} />
                {detail.typeConfig.label}
              </span>
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-5xl">
              {detail.name}
            </h1>

            {detail.mapFields?.country ? (
              <p className="flex items-center gap-2 text-base font-semibold tracking-wide text-muted-foreground">
                {detail.mapFields.cityCode ? <span className="uppercase">{detail.mapFields.cityCode}</span> : null}
                {detail.mapFields.cityCode ? (
                  <span
                    aria-hidden={true}
                    className="inline-block h-4 w-px bg-[color-mix(in_srgb,var(--muted-foreground)_55%,transparent)]"
                  />
                ) : null}
                {CountryFlagIcon ? (
                  <CountryFlagIcon
                    aria-hidden={true}
                    className="h-3.5 w-5 rounded-[2px] border border-border/60 object-cover"
                  />
                ) : null}
                <span>{detail.mapFields.country}</span>
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base font-medium text-muted-foreground">
              <div className="flex items-center gap-3 text-base font-medium text-muted-foreground">
                {detail.downloads !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowDownToLine className="size-4.5" aria-hidden={true} />
                    <span className="tabular-nums">{numberFormatter.format(detail.downloads)}</span>
                  </span>
                ) : null}

                {detail.mapFields?.population !== null && detail.mapFields?.population !== undefined ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4.5" aria-hidden={true} />
                    <span className="tabular-nums">{numberFormatter.format(detail.mapFields.population)}</span>
                  </span>
                ) : null}
              </div>

            </div>
          </div>

          <Button
            type="button"
            className="w-full shrink-0 gap-2 text-base text-[var(--suite-text-inverted-light)] lg:w-auto lg:self-start"
            style={{
              background: "var(--registry-type-accent)",
            }}
            onClick={onOpenInRailyard}
          >
            <Download className="size-4" aria-hidden={true} />
            Download
          </Button>
        </div>
      </div>
    </header>
  );
}
