import Link from 'next/link';
import { ContributorTierBadge } from '@/components/shared/contributor-tier-badge';
import {
  getAuthorDisplayName,
  isExternalHref,
  type AuthorIdentity,
} from '@/lib/authors';
import { cn } from '@/lib/utils';

type AuthorNameProps = {
  author: AuthorIdentity;
  href?: string;
  external?: boolean;
  className?: string;
  nameClassName?: string;
  linkClassName?: string;
  style?: React.CSSProperties;
  contributorVariant?: 'pill' | 'icon';
};

function AuthorNameContent({
  author,
  className,
  nameClassName,
  contributorVariant,
}: Pick<
  AuthorNameProps,
  'author' | 'className' | 'nameClassName' | 'contributorVariant'
>) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-[0.45em] align-middle',
        className,
      )}
    >
      <span className={cn('min-w-0 truncate', nameClassName)}>
        {getAuthorDisplayName(author)}
      </span>
      {author.contributor_tier ? (
        <ContributorTierBadge
          tier={author.contributor_tier}
          variant={contributorVariant}
        />
      ) : null}
    </span>
  );
}

export function AuthorName({
  author,
  href,
  external,
  className,
  nameClassName,
  linkClassName,
  style,
  contributorVariant = 'icon',
}: AuthorNameProps) {
  const content = (
    <AuthorNameContent
      author={author}
      className={className}
      nameClassName={nameClassName}
      contributorVariant={contributorVariant}
    />
  );

  if (!href) return content;

  const renderExternal = external ?? isExternalHref(href);
  if (renderExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName} style={style}>
      {content}
    </Link>
  );
}
