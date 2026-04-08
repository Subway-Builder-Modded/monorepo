import { CodeXml, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CONTRIBUTOR_TIER_STYLES } from '@/config/ui/contribute';
import type { ContributorTier } from '@/types/registry';

type ContributorTierBadgeProps = {
  tier: ContributorTier;
  variant?: 'pill' | 'icon';
};

function getContributorTierIcon(tier: ContributorTier) {
  return tier === 'developer' ? CodeXml : Heart;
}

export function ContributorTierBadge({
  tier,
  variant = 'icon',
}: ContributorTierBadgeProps) {
  const { label, color } = CONTRIBUTOR_TIER_STYLES[tier];
  const Icon = getContributorTierIcon(tier);

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex shrink-0 items-center justify-center align-middle"
              aria-label={label}
            >
              <Icon
                className="size-[0.95em]"
                style={{ color }}
                aria-hidden="true"
              />
            </span>
          </TooltipTrigger>
          <TooltipContent
            className="text-white"
            style={{
              backgroundColor: color,
              ['--tier-tooltip-bg' as string]: color,
            }}
            arrowClassName="bg-[var(--tier-tooltip-bg)] fill-[var(--tier-tooltip-bg)]"
          >
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge
      className="shrink-0 rounded-full border bg-transparent font-medium leading-none tracking-normal"
      style={{
        borderColor: color,
        color,
        minHeight: '1.5em',
        padding: '0 0.68em',
        fontSize: '0.78em',
        lineHeight: 1,
      }}
    >
      {label}
    </Badge>
  );
}
