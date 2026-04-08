import type { CSSProperties } from 'react';
import { CodeXml, Heart, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from 'radix-ui';
import { getContributorTierInfo } from '@sbm/shared/railyard-core/contributor-tier';

export type ContributorTierIconSize = 'sm' | 'default';

interface ContributorTierIconProps {
  tier: string | undefined;
  size?: ContributorTierIconSize;
}

const ICON_SIZE: Record<ContributorTierIconSize, string> = {
  sm: 'size-3',
  default: 'size-3.5',
};

const TIER_ICONS: Record<string, LucideIcon> = {
  developer: CodeXml,
  engineer: Heart,
  conductor: Heart,
  executive: Heart,
  collaborator: UsersRound,
};

function getTierIcon(tier: string): LucideIcon {
  return TIER_ICONS[tier] ?? Heart;
}

export function ContributorTierIcon({
  tier,
  size = 'default',
}: ContributorTierIconProps) {
  const info = getContributorTierInfo(tier);
  if (!info) return null;

  const Icon = getTierIcon(tier!);

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex shrink-0 items-center justify-center">
            <Icon className={ICON_SIZE[size]} style={{ color: info.color }} />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="rounded-md px-2 py-1 text-xs text-white animate-in fade-in-0 zoom-in-95"
            style={
              {
                '--surface-raised': info.color,
                backgroundColor: info.color,
              } as CSSProperties
            }
            sideOffset={4}
          >
            {info.label}
            <Tooltip.Arrow style={{ fill: info.color }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

