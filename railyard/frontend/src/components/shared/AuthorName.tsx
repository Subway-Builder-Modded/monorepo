import { cn } from '@/lib/utils';

import {
  ContributorTierIcon,
  type ContributorTierIconSize,
} from './ContributorTierIcon';

interface AuthorNameProps {
  name: string;
  contributorTier?: string;
  size?: ContributorTierIconSize;
  className?: string;
}

export function AuthorName({
  name,
  contributorTier,
  size = 'default',
  className,
}: AuthorNameProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1',
        className,
      )}
    >
      <span className="min-w-0 truncate">{name}</span>
      <ContributorTierIcon tier={contributorTier} size={size} />
    </span>
  );
}
