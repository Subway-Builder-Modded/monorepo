import { CircleAlert } from 'lucide-react';

import {
  ReviewDetailRow,
  ReviewDialog,
} from '@/components/shared/ReviewDialog';
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
  const total = assets.length;
  if (total === 0) return null;

  return (
    <ReviewDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={CircleAlert}
      iconClassName="text-destructive"
      title="Incompatible Assets"
      tone="uninstall"
      description={`${
        total === 1 ? '1 installed asset is' : `${total} installed assets are`
      } incompatible with the current game version and may not function as intended.`}
      itemCount={total}
      renderItem={(index) => {
        const asset = assets[index];
        return (
          <>
            <ReviewDetailRow label="Incompatible Asset" value={asset.name} />
            <ReviewDetailRow
              label="Asset Type"
              value={asset.assetType === 'map' ? 'Map' : 'Mod'}
            />
            <ReviewDetailRow
              label="Incompatibility Reason"
              value={primaryFailureReason(asset.constraints)}
            />
          </>
        );
      }}
      actions={[
        { label: 'Cancel', variant: 'outline', onClick: () => onOpenChange(false) },
        {
          label: 'Launch Without Incompatible Assets',
          variant: 'outline',
          onClick: onSkip,
        },
        { label: 'Understood, Continue', variant: 'solid', onClick: onContinue },
      ]}
      loading={loading}
    />
  );
}
