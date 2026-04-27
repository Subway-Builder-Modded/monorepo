import { cn } from '../lib/cn';

export type ReleaseStatus = 'release' | 'beta' | 'pre-release' | 'latest';
export type ReleaseStatusChipSize = 'default' | 'title';

type ReleaseStatusChipConfig = {
  label: string;
  toneClassName: string;
};

const STATUS_CONFIG: Record<ReleaseStatus, ReleaseStatusChipConfig> = {
  release: {
    label: 'Release',
    toneClassName: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  },
  beta: {
    label: 'Beta',
    toneClassName: 'bg-yellow-500/14 text-yellow-700 dark:text-yellow-300',
  },
  'pre-release': {
    label: 'Pre-Release',
    toneClassName: 'bg-red-500/12 text-red-700 dark:text-red-300',
  },
  latest: {
    label: 'Latest',
    toneClassName: 'bg-blue-500/14 text-blue-700 dark:text-blue-300',
  },
};

export type ReleaseStatusChipProps = {
  status: ReleaseStatus;
  size?: ReleaseStatusChipSize;
  label?: string;
  className?: string;
};

export function ReleaseStatusChip({
  status,
  size = 'default',
  label,
  className,
}: ReleaseStatusChipProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex rounded-md font-semibold',
        size === 'title'
          ? 'px-2.5 py-1 text-sm leading-none sm:px-3 sm:py-1.5 sm:text-base'
          : 'px-2 py-0.5 text-[11px]',
        config.toneClassName,
        className,
      )}
    >
      {label ?? config.label}
    </span>
  );
}
