import { cx } from './cx';
import {
  ContributorTierIcon,
  type ContributorTierIconSize,
} from './contributor-tier-icon';

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
      className={cx(
        'inline-flex min-w-0 max-w-full items-center gap-1',
        className,
      )}
    >
      <span className="min-w-0 truncate">{name}</span>
      <ContributorTierIcon tier={contributorTier} size={size} />
    </span>
  );
}

