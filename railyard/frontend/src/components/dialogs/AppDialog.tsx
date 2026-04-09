import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@subway-builder-modded/shared-ui';
import { Loader2, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import {
  getLocalAccentClasses,
  getToneVarsClass,
  type LocalAccentTone,
} from '@/lib/local-accent';

interface AppDialogConfirm {
  label: ReactNode;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: ReactNode;
}

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: LucideIcon;
  description: ReactNode;
  tone: LocalAccentTone;
  confirm?: AppDialogConfirm;
  children?: ReactNode;
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  icon: Icon,
  description,
  tone,
  confirm,
  children,
}: AppDialogProps) {
  const accent = getLocalAccentClasses(tone);
  const toneVarsClass = getToneVarsClass(tone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 ${toneVarsClass} text-[var(--local-tone-primary)]`}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirm?.loading}
            className={accent.dialogCancel}
          >
            {confirm ? (confirm.cancelLabel ?? 'Cancel') : 'Close'}
          </Button>
          {confirm && (
            <div className="flex flex-col items-end gap-1">
              {confirm.disabledReason ? (
                <span className="text-[11px] text-muted-foreground">
                  {confirm.disabledReason}
                </span>
              ) : null}
              <Button
                onClick={confirm.onConfirm}
                disabled={confirm.loading || confirm.disabled}
                className={`gap-1.5 ${accent.solidButton}`}
              >
                {confirm.loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {confirm.label}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
