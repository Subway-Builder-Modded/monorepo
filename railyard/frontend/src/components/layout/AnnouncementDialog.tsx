import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  getLocalAccentClasses,
  getToneVarsClass,
} from '@subway-builder-modded/shared-ui';
import { Megaphone } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useAnnouncementStore } from '@/stores/announcement-store';

// Built on the Dialog primitives rather than AppDialog, which renders its
// description muted and owns the footer.
const ANNOUNCEMENT_TONE = 'update';

export interface AnnouncementDialogProps {
  /** Gates the once-on-load prompt until the app is past setup and startup. */
  ready: boolean;
}

export function AnnouncementDialog({ ready }: AnnouncementDialogProps) {
  const active = useAnnouncementStore((s) => s.active);
  const initialized = useAnnouncementStore((s) => s.initialized);
  const initialize = useAnnouncementStore((s) => s.initialize);
  const showUnseen = useAnnouncementStore((s) => s.showUnseen);
  const dismiss = useAnnouncementStore((s) => s.dismiss);
  const prompted = useRef(false);
  const accent = getLocalAccentClasses(ANNOUNCEMENT_TONE);

  useEffect(() => {
    if (ready) void initialize();
  }, [ready, initialize]);

  // The latch keeps a re-render from re-opening an announcement the user closed
  // within the same session.
  useEffect(() => {
    if (!ready || !initialized || prompted.current) return;
    prompted.current = true;
    showUnseen();
  }, [ready, initialized, showUnseen]);

  if (!active) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void dismiss();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone
              className={`h-5 w-5 ${getToneVarsClass(ANNOUNCEMENT_TONE)} text-[var(--local-tone-primary)]`}
            />
            {active.title}
          </DialogTitle>
        </DialogHeader>

        <div className="border-t border-border/60" />

        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <DialogDescription className="text-sm leading-relaxed text-foreground">
            {active.summary}
          </DialogDescription>

          {active.bullets ? (
            <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground marker:text-muted-foreground/70">
              {active.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          {active.closing?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <DialogFooter className="sm:items-center sm:justify-between">
          {active.signoff ? (
            <span className="text-xs text-muted-foreground">
              {active.signoff}
            </span>
          ) : (
            <span />
          )}
          <Button
            variant="outline"
            onClick={() => void dismiss()}
            className={accent.dialogCancel}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
