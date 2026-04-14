import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  cn,
} from '../index';
import { X } from 'lucide-react';

export type ContributorTier =
  | 'developer'
  | 'engineer'
  | 'conductor'
  | 'executive'
  | 'collaborator';

export interface ContributorTierConfig {
  label: string;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CreditAuthor {
  id: string;
  name: string;
  tier: ContributorTier | null;
  attributionLink?: string;
  children?: React.ReactNode;
}

export interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authors: CreditAuthor[];
  tierConfigs: Record<ContributorTier, ContributorTierConfig>;
  tierOrder?: ContributorTier[];
}

const DEFAULT_TIER_ORDER: ContributorTier[] = [
  'developer',
  'collaborator',
  'executive',
  'conductor',
  'engineer',
];

function groupAuthorsByTier(
  authors: CreditAuthor[],
): Record<ContributorTier | 'uncategorized', CreditAuthor[]> {
  const grouped: Record<ContributorTier | 'uncategorized', CreditAuthor[]> = {
    developer: [],
    collaborator: [],
    executive: [],
    conductor: [],
    engineer: [],
    uncategorized: [],
  };

  for (const author of authors) {
    if (author.tier && author.tier in grouped) {
      grouped[author.tier as ContributorTier].push(author);
    } else {
      grouped.uncategorized.push(author);
    }
  }

  // Sort each group alphabetically by name
  Object.keys(grouped).forEach((key) => {
    grouped[key as keyof typeof grouped].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });

  return grouped;
}

function getTierDisplayName(
  tier: ContributorTier | null,
): string {
  if (!tier) return '';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function CreditsModal({
  open,
  onOpenChange,
  authors,
  tierConfigs,
  tierOrder = DEFAULT_TIER_ORDER,
}: CreditsModalProps) {
  const groupedByTier = groupAuthorsByTier(authors);

  // Filter to only tiers with authors, but maintain order
  const activeTiers = tierOrder.filter(
    (tier) => groupedByTier[tier].length > 0,
  );

  // Note: uncategorized section is not displayed

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[85vh] w-[90vw] max-w-5xl rounded-xl border border-border/50 p-0',
          'bg-card/98 backdrop-blur-md shadow-2xl flex flex-col',
        )}
      >
        <div className="sticky top-0 z-10 border-b border-border/50 bg-card/98 backdrop-blur-md px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">Credits</DialogTitle>
              <DialogDescription className="mt-2 text-sm">
                The amazing community members who contribute to this project's
                success
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent/50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 px-6 py-6">
              {activeTiers.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  No contributors found.
                </p>
              ) : (
                activeTiers.map((tier) => {
                  if (!tier) return null;

                  const tierAuthors = groupedByTier[tier as ContributorTier];
                  if (tierAuthors.length === 0) return null;

                  const tierLabel = getTierDisplayName(tier);
                  const tierConfig = tier && tierConfigs[tier as ContributorTier];
                  const tierColor = tierConfig?.color || '#6b7280';
                  const TierIcon = tierConfig?.icon;

                  return (
                    <section key={tier}>
                      <div className="mb-4 flex items-center gap-3">
                        {TierIcon && (
                          <span style={{ color: tierColor }}>
                            <TierIcon className="size-5 shrink-0" />
                          </span>
                        )}
                        <h3
                          className="text-lg font-bold"
                          style={{ color: tierColor }}
                        >
                          {tierLabel}
                        </h3>
                        <span className="ml-auto text-xs font-medium text-muted-foreground bg-accent/30 px-2 py-1 rounded-full">
                          {tierAuthors.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {tierAuthors.map((author) => (
                          <AuthorCard
                            key={author.id}
                            author={author}
                            tierColor={tierColor}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

interface AuthorCardProps {
  author: CreditAuthor;
  tierColor: string;
}

function AuthorCard({ author, tierColor }: AuthorCardProps) {
  const content = (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-sm font-medium">{author.name}</span>
      {author.children}
    </div>
  );

  if (author.attributionLink) {
    return (
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.open) {
            window.open(author.attributionLink, '_blank', 'noopener,noreferrer');
          }
        }}
        className={cn(
          'group relative block w-full rounded-lg border border-border/50 px-4 py-3 transition-all duration-150',
          'bg-card/50 hover:bg-card/80 hover:border-border text-left',
          'hover:shadow-md',
        )}
        style={{
          borderLeftColor: tierColor,
          borderLeftWidth: '3px',
        }}
        type="button"
        aria-label={`Open ${author.name}'s profile`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 px-4 py-3',
        'bg-card/50',
      )}
      style={{
        borderLeftColor: tierColor,
        borderLeftWidth: '3px',
      }}
      role="article"
    >
      {content}
    </div>
  );
}
