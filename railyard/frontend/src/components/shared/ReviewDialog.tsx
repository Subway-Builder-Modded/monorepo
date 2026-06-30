import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  getLocalAccentClasses,
  getToneVarsClass,
  type LocalAccentTone,
} from '@subway-builder-modded/shared-ui';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export interface ReviewDialogAction {
  label: ReactNode;
  onClick: () => void;
  variant: 'solid' | 'outline';
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: ReactNode;
  tone: LocalAccentTone;
  /** Number of reviewable items paged through in the detail panel. */
  itemCount: number;
  renderItem: (index: number) => ReactNode;
  actions: ReviewDialogAction[];
  loading?: boolean;
}

// ReviewDetailRow renders a "Label: value" line, shared by every review panel.
export function ReviewDetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium text-foreground">{value}</span>
    </p>
  );
}

// ReviewDialog is a paginated, multi-action confirmation dialog: a single
// detail card the user can flip through, plus a flexible footer of 1–3 actions.
// Used for both the launch incompatibility prompt and the import plan summary.
export function ReviewDialog({
  open,
  onOpenChange,
  icon: Icon,
  iconClassName,
  title,
  description,
  tone,
  itemCount,
  renderItem,
  actions,
  loading,
}: ReviewDialogProps) {
  const accent = getLocalAccentClasses(tone);
  const toneVarsClass = getToneVarsClass(tone);
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, itemCount - 1));

  if (itemCount <= 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setIndex(0);
        onOpenChange(value);
      }}
    >
      <DialogContent showCloseButton={false} size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              className={cn(
                'h-5 w-5',
                toneVarsClass,
                iconClassName ?? 'text-(--local-tone-primary)',
              )}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            accent.dialogPanel,
            'rounded-md border bg-muted/30 px-3 py-2 text-xs',
          )}
        >
          <div className="space-y-1">{renderItem(safeIndex)}</div>
        </div>

        {itemCount > 1 && (
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              aria-label="Previous item"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              {safeIndex + 1} of {itemCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIndex((i) => Math.min(itemCount - 1, i + 1))}
              disabled={safeIndex === itemCount - 1}
              aria-label="Next item"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DialogFooter>
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant === 'solid' ? 'default' : 'outline'}
              onClick={action.onClick}
              disabled={loading}
              className={
                action.variant === 'solid'
                  ? accent.solidButton
                  : accent.dialogCancel
              }
            >
              {action.label}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
