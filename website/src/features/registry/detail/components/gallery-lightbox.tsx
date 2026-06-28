import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@subway-builder-modded/shared-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryLightboxProps = {
  open: boolean;
  images: string[];
  currentIndex: number;
  accentColor: string;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function GalleryLightbox({
  open,
  images,
  currentIndex,
  accentColor,
  onOpenChange,
  onPrevious,
  onNext,
}: GalleryLightboxProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onNext, onPrevious]);

  const imageSrc = images[currentIndex] ?? null;
  const hasMultipleImages = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        unstyled={true}
        showCloseButton={false}
        className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center border-none bg-transparent p-0 shadow-none outline-none"
        style={{ ["--gallery-lightbox-accent" as string]: accentColor }}
      >
        <DialogTitle className="sr-only">Gallery lightbox</DialogTitle>
        <DialogDescription className="sr-only">
          Image preview with keyboard navigation.
        </DialogDescription>

        {imageSrc ? (
          <div
            className="relative flex h-full w-full items-center justify-center p-2 sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                onOpenChange(false);
              }
            }}
          >
            <div className="relative inline-block max-h-full max-w-full rounded-xl border border-border/65 bg-card/80 p-2 shadow-2xl sm:p-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={!hasMultipleImages}
                className="group absolute left-1 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--gallery-lightbox-accent)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gallery-lightbox-accent)] sm:left-2 sm:h-14 sm:w-14"
                aria-label="Previous image"
              >
                <ChevronLeft
                  className="size-10 text-current transition-colors group-hover:text-[var(--gallery-lightbox-accent)]"
                  aria-hidden={true}
                />
              </button>

              <button
                type="button"
                onClick={onNext}
                disabled={!hasMultipleImages}
                className="group absolute right-1 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--gallery-lightbox-accent)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gallery-lightbox-accent)] sm:right-2 sm:h-14 sm:w-14"
                aria-label="Next image"
              >
                <ChevronRight
                  className="size-10 text-current transition-colors group-hover:text-[var(--gallery-lightbox-accent)]"
                  aria-hidden={true}
                />
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="group absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--gallery-lightbox-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gallery-lightbox-accent)]"
                aria-label="Close gallery"
              >
                <X
                  className="size-7 text-current transition-colors group-hover:text-[var(--gallery-lightbox-accent)]"
                  aria-hidden={true}
                />
              </button>

              <div className="overflow-hidden rounded-md border border-border/60 bg-black/40">
                <img
                  src={imageSrc}
                  alt={`Gallery image ${currentIndex + 1}`}
                  className="h-auto w-auto max-h-[calc(100vh-5rem)] max-w-[calc(100vw-3rem)] object-contain sm:max-h-[calc(100vh-6rem)] sm:max-w-[calc(100vw-4rem)]"
                />
              </div>

              <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-card/90 px-4 py-1.5 text-sm font-semibold text-foreground shadow-md">
                {currentIndex + 1}/{images.length}
              </span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
