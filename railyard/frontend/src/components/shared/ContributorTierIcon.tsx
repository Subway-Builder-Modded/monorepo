import type { CSSProperties } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getContributorTierStyle } from '@/lib/contributor-tier';

export type ContributorTierIconSize = 'sm' | 'default';

interface ContributorTierIconProps {
  tier: string | undefined;
  size?: ContributorTierIconSize;
}

const ICON_SIZE: Record<ContributorTierIconSize, string> = {
  sm: 'size-3',
  default: 'size-3.5',
};

export function ContributorTierIcon({
  tier,
  size = 'default',
}: ContributorTierIconProps) {
  const style = getContributorTierStyle(tier);
  if (!style) return null;

  const Icon = style.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0 items-center justify-center">
            <Icon className={ICON_SIZE[size]} style={{ color: style.color }} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="border-transparent text-white"
          style={
            {
              '--surface-raised': style.color,
            } as CSSProperties
          }
        >
          {style.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
