import { CircleAlert } from 'lucide-react';

import {
  ReviewDetailRow,
  ReviewDialog,
} from '@/components/shared/ReviewDialog';
import {
  describeConstraintRequirement,
  type InstalledConstraint,
} from '@/lib/version-compatibility';

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

export function IncompatibleAssetsDialog({
  open,
  onOpenChange,
  gameVersion,
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
      } incompatible with game ${gameVersion} and may not function as intended.`}
      itemCount={total}
      renderItem={(index) => {
        const asset = assets[index];
        // asset.constraints are the failing constraints (buildings-index first).
        return (
          <>
            <ReviewDetailRow label="Incompatible Asset" value={asset.name} />
            <ReviewDetailRow
              label="Asset Type"
              value={asset.assetType === 'map' ? 'Map' : 'Mod'}
            />
            {asset.constraints.map((c) => (
              <p key={c.type} className="text-foreground">
                {describeConstraintRequirement(c)}
              </p>
            ))}
          </>
        );
      }}
      actions={[
        {
          label: 'Cancel',
          variant: 'outline',
          onClick: () => onOpenChange(false),
        },
        {
          label: 'Launch Without Incompatible Assets',
          variant: 'outline',
          onClick: onSkip,
        },
        {
          label: 'Understood, Continue',
          variant: 'solid',
          onClick: onContinue,
        },
      ]}
      loading={loading}
    />
  );
}
