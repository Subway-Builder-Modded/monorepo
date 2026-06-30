import { ImageChip } from '@subway-builder-modded/asset-listings-ui';
import { Check, CircleAlert, FileArchive, TriangleAlert } from 'lucide-react';

import {
  type ReviewDialogAction,
  ReviewDetailRow,
  ReviewDialog,
} from '@/components/shared/ReviewDialog';

import type { types } from '../../../wailsjs/go/models';

function conflictSourceLabel(conflict: types.MapCodeConflict): string {
  if (conflict.existingAssetId?.startsWith('vanilla:')) return 'Vanilla';
  return conflict.existingIsLocal ? 'Local' : 'Registry';
}

// One pill per status, colour-coded so new / conflict / invalid read at a glance.
function ImportStatusBadge({ status }: { status: string }) {
  if (status === 'conflict') {
    return (
      <ImageChip className="border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <TriangleAlert className="h-2.5 w-2.5 shrink-0" />
        Replaces Existing
      </ImageChip>
    );
  }
  if (status === 'invalid') {
    return (
      <ImageChip className="border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-400">
        <CircleAlert className="h-2.5 w-2.5 shrink-0" />
        Invalid
      </ImageChip>
    );
  }
  return (
    <ImageChip className="border-green-400/30 bg-green-500/10 text-green-700 dark:text-green-400">
      <Check className="h-2.5 w-2.5 shrink-0" />
      New
    </ImageChip>
  );
}

interface ImportPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Every selected archive, in display order — new, conflict and invalid alike.
  items: types.ImportArchiveInspection[];
  onCancel: () => void;
  onImportNewOnly: () => void;
  onReplaceAll: () => void;
  loading?: boolean;
}

export function ImportPlanDialog({
  open,
  onOpenChange,
  items,
  onCancel,
  onImportNewOnly,
  onReplaceAll,
  loading,
}: ImportPlanDialogProps) {
  const newCount = items.filter((item) => item.status === 'new').length;
  const conflictCount = items.filter(
    (item) => item.status === 'conflict',
  ).length;
  const invalidCount = items.filter((item) => item.status === 'invalid').length;
  const total = items.length;
  const mapWord = total === 1 ? 'map' : 'maps';

  const breakdown = [
    `${newCount} new`,
    conflictCount > 0 ? `${conflictCount} replacing existing` : null,
    invalidCount > 0 ? `${invalidCount} invalid` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const description =
    invalidCount > 0
      ? `${total} ${mapWord} selected — ${breakdown}. Invalid archives are skipped.`
      : `${total} ${mapWord} selected — ${breakdown}.`;

  // Footer adapts to the plan: only offer "replace" when conflicts exist, and
  // only offer the new subset when there is one to import.
  const actions: ReviewDialogAction[] = [
    { label: 'Cancel', variant: 'outline', onClick: onCancel },
  ];
  if (conflictCount > 0) {
    if (newCount > 0) {
      actions.push({
        label: 'Import New Only',
        variant: 'outline',
        onClick: onImportNewOnly,
      });
    }
    actions.push({
      label: newCount > 0 ? 'Replace & Import All' : 'Replace Existing',
      variant: 'solid',
      onClick: onReplaceAll,
    });
  } else if (newCount > 0) {
    actions.push({
      label: invalidCount > 0 ? 'Import Valid Maps' : 'Import All',
      variant: 'solid',
      onClick: onImportNewOnly,
    });
  }

  return (
    <ReviewDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={FileArchive}
      title={`Review Import (${total} ${mapWord})`}
      tone="files"
      description={description}
      itemCount={items.length}
      renderItem={(index) => {
        const item = items[index];
        return (
          <>
            <div className="mb-1.5">
              <ImportStatusBadge status={item.status} />
            </div>
            {item.status === 'invalid' ? (
              <>
                <ReviewDetailRow label="File" value={item.name} />
                <ReviewDetailRow
                  label="Problem"
                  value={item.error || 'Invalid map archive.'}
                />
              </>
            ) : (
              <ReviewDetailRow
                label="Map"
                value={`${item.name} (${item.code})`}
              />
            )}
            {item.status === 'conflict' && item.conflict ? (
              <>
                <ReviewDetailRow
                  label="Replaces"
                  value={`${item.conflict.existingAssetId} (${conflictSourceLabel(
                    item.conflict,
                  )})`}
                />
                {item.conflict.existingVersion ? (
                  <ReviewDetailRow
                    label="Existing Version"
                    value={item.conflict.existingVersion}
                  />
                ) : null}
              </>
            ) : null}
          </>
        );
      }}
      actions={actions}
      loading={loading}
    />
  );
}
