import { useEffect } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@subway-builder-modded/shared-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryLightboxProps = {
  open: boolean;
  images: string[];
  currentIndex: number;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function GalleryLightbox({
  open,
  images,
  currentIndex,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl border-border/70 bg-background p-3 sm:p-4">
        <DialogTitle className="sr-only">Gallery lightbox</DialogTitle>
        <DialogDescription className="sr-only">Image preview with keyboard navigation.</DialogDescription>

        {imageSrc ? (
          <div className="relative">
            <img
              src={imageSrc}
              alt={`Gallery image ${currentIndex + 1}`}
              className="max-h-[78vh] w-full rounded-lg object-contain"
            />

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" aria-hidden={true} />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" aria-hidden={true} />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-2 top-2"
              aria-label="Close gallery"
            >
              <X className="size-4" aria-hidden={true} />
            </Button>
          </div>
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          {images.length === 0 ? "" : `${currentIndex + 1} / ${images.length}`}
        </p>
      </DialogContent>
    </Dialog>
  );
}
