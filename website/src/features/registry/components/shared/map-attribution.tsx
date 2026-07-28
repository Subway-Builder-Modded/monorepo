import { cn } from "@/lib/utils";

type MapAttributionProps = {
  /** Hover accent classes for the links, e.g. "hover:text-(--registry-type-accent)". */
  linkHoverClassName: string;
};

/** Attribution pill shown in the corner of MapLibre maps. */
export function MapAttribution({ linkHoverClassName }: MapAttributionProps) {
  const linkClassName = cn(
    "text-foreground/85 decoration-current underline-offset-2 transition-colors hover:underline",
    linkHoverClassName,
  );

  return (
    <div className="absolute bottom-2 right-2 z-30 rounded-full border border-border/75 bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
      <div className="whitespace-nowrap leading-none">
        <a
          href="https://openfreemap.org"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          OpenFreeMap
        </a>
        <span aria-hidden={true}>{" © "}</span>
        <a
          href="https://www.openmaptiles.org"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          OpenMapTiles
        </a>
        <span>{" Data from "}</span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}
