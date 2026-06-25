import type { ComponentType } from "react";
import { NeutralFadedUnderline } from "@subway-builder-modded/shared-ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MapViewIndicatorProps = {
  icon: ComponentType<{ className?: string }>;
  viewName: string;
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function MapViewIndicator({
  icon: ViewIcon,
  viewName,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: MapViewIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
        aria-label="Show previous metric"
      >
        <ChevronLeft className="size-7" aria-hidden={true} />
      </button>

      <p className="inline-flex min-w-0 items-center justify-center gap-2 text-center text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">
        <ViewIcon className="size-6 shrink-0 text-current sm:size-7" aria-hidden={true} />
        <span className="relative inline-block align-baseline">
          <span className="block">{viewName}</span>
          <NeutralFadedUnderline className="pointer-events-none absolute -bottom-[0.2em] left-0 right-0" />
        </span>
        <span className="shrink-0 text-muted-foreground">
          ({currentPage}/{totalPages})
        </span>
      </p>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--registry-type-accent)]"
        aria-label="Show next metric"
      >
        <ChevronRight className="size-7" aria-hidden={true} />
      </button>
    </div>
  );
}
