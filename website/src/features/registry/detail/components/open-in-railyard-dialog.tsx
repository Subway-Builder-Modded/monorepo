import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@subway-builder-modded/shared-ui";
import { Download, ExternalLink, TrainTrack } from "lucide-react";

type OpenInRailyardDialogProps = {
  open: boolean;
  itemName: string;
  itemThumbnailSrc: string | null;
  latestDownloadUrl: string | null;
  railyardAccentLight: string;
  railyardAccentDark: string;
  onOpenChange: (open: boolean) => void;
  onOpenRailyard: () => void;
};

export function OpenInRailyardDialog({
  open,
  itemName,
  itemThumbnailSrc,
  latestDownloadUrl,
  railyardAccentLight,
  railyardAccentDark,
  onOpenChange,
  onOpenRailyard,
}: OpenInRailyardDialogProps) {
  const titleText = `Download ${itemName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[var(--overlay-scrim-strong)]"
        className="grid w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 shadow-2xl sm:max-w-xl"
      >
        <div className="space-y-4 px-4 py-5 sm:px-5 sm:py-6">
          <DialogTitle className="sr-only">{titleText}</DialogTitle>
          <DialogDescription className="sr-only">
            Choose how to open or download this listing.
          </DialogDescription>

          <div className="flex items-center gap-3">
            {itemThumbnailSrc ? (
              <img
                src={itemThumbnailSrc}
                alt={`${itemName} thumbnail`}
                className="h-14 w-14 rounded-lg border border-border/70 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                No Image
              </div>
            )}

            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {titleText}
            </h2>
          </div>

          <div className="h-px w-full bg-border/75" />

          <section className="space-y-2.5">
            <button
              type="button"
              onClick={onOpenRailyard}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--railyard-accent-light)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-95 dark:bg-[var(--railyard-accent-dark)]"
              style={{
                ["--railyard-accent-light" as string]: railyardAccentLight,
                ["--railyard-accent-dark" as string]: railyardAccentDark,
              }}
            >
              <TrainTrack className="size-4" aria-hidden={true} />
              Open in Railyard
            </button>

            <a
              href="/railyard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/35"
            >
              <ExternalLink className="size-4" aria-hidden={true} />
              Download Railyard
            </a>
          </section>

          <div className="mx-2 h-px bg-gradient-to-r from-transparent via-border/75 to-transparent" />

          <section>
            {latestDownloadUrl ? (
              <a
                href={latestDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/35"
              >
                <Download className="size-4" aria-hidden={true} />
                Download
              </a>
            ) : (
              <div className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/15 px-4 text-sm font-medium text-muted-foreground">
                <Download className="size-4" aria-hidden={true} />
                Download unavailable
              </div>
            )}
          </section>
        </div>

        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden={true} className="text-lg leading-none font-semibold">
              ×
            </span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
