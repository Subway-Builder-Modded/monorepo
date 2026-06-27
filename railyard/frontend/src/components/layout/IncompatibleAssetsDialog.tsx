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
} from '@subway-builder-modded/shared-ui';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import { useState } from 'react';

import type { InstalledConstraint } from '@/lib/version-compatibility';

export interface IncompatibleAsset {
  name: string;
  version: string;
  assetType: 'map' | 'mod';
  constraints: InstalledConstraint[];
}

interface IncompatibleAssetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameVersion: string;
  assets: IncompatibleAsset[];
  onSkip: () => void;
  onContinue: () => void;
  loading?: boolean;
}

const ACCENT = getLocalAccentClasses('uninstall');

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium text-foreground">{value}</span>
    </p>
  );
}

function constraintTypeLabel(type: string): string {
  if (type === 'buildings_index') return 'Buildings index format';
  if (type === 'manifest') return 'Game version';
  return type;
}

function primaryFailureReason(constraints: InstalledConstraint[]): string {
  // buildings_index is sorted first by getFailingConstraints; show the top one
  const c = constraints[0];
  if (!c) return 'Unknown';
  return `${constraintTypeLabel(c.type)} (requires ${c.range})`;
}

export function IncompatibleAssetsDialog({
  open,
  onOpenChange,
  gameVersion: _gameVersion,
  assets,
  onSkip,
  onContinue,
  loading,
}: IncompatibleAssetsDialogProps) {
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, assets.length - 1));
  const asset = assets[safeIndex];
  const total = assets.length;

  if (!asset) return null;

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
            <CircleAlert className="h-5 w-5 text-destructive" />
            Incompatible Assets
          </DialogTitle>
          <DialogDescription>
            {total === 1
              ? '1 installed asset is'
              : `${total} installed assets are`}{' '}
            incompatible with the current game version and may not function as
            intended.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            ACCENT.dialogPanel,
            'rounded-md border bg-muted/30 px-3 py-2 text-xs',
          )}
        >
          <div className="space-y-1">
            <DetailRow label="Incompatible Asset" value={asset.name} />
            <DetailRow
              label="Asset Type"
              value={asset.assetType === 'map' ? 'Map' : 'Mod'}
            />
            <DetailRow
              label="Incompatibility Reason"
              value={primaryFailureReason(asset.constraints)}
            />
          </div>
        </div>

        {total > 1 && (
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              aria-label="Previous asset"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              {safeIndex + 1} of {total}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={safeIndex === total - 1}
              aria-label="Next asset"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className={ACCENT.dialogCancel}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={loading}
            className={ACCENT.dialogCancel}
          >
            Launch Without Incompatible Assets
          </Button>
          <Button
            onClick={onContinue}
            disabled={loading}
            className={ACCENT.solidButton}
          >
            Understood, Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
