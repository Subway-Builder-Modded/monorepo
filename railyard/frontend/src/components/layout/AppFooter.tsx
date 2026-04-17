import {
  APP_SHELL_PADDING_CLASS,
  APP_SHELL_WIDTH_CLASS,
  Button,
} from '@subway-builder-modded/shared-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import { BookText, Heart, Megaphone } from 'lucide-react';
import { useState } from 'react';

import { DiscordIcon, GitHubIcon } from '@/components/icons/social-icons';
import { RailyardCreditsModal } from '@/components/shared/RailyardCreditsModal';
import { useRegistryStore } from '@/stores/registry-store';

import { BrowserOpenURL } from '../../../wailsjs/runtime/runtime';

type CommunityLink =
  | { id: 'credits'; label: string; icon: typeof Heart; action: 'credits' }
  | { id: string; label: string; href: string; icon: any };

const COMMUNITY_LINKS: CommunityLink[] = [
  {
    id: 'credits',
    label: 'Credits',
    icon: Heart,
    action: 'credits',
  },
  {
    id: 'docs',
    label: 'Documentation',
    href: 'https://subwaybuildermodded.com/railyard/docs',
    icon: BookText,
  },
  {
    id: 'updates',
    label: 'Updates',
    href: 'https://subwaybuildermodded.com/railyard/updates',
    icon: Megaphone,
  },
  {
    id: 'discord',
    label: 'Discord',
    href: 'https://discord.gg/syG9YHMyeG',
    icon: DiscordIcon,
  },
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/Subway-Builder-Modded',
    icon: GitHubIcon,
  },
];

export interface AppFooterProps {
  version: string;
}

export function AppFooter({ version }: AppFooterProps) {
  const [showCredits, setShowCredits] = useState(false);
  const maps = useRegistryStore((s) => s.maps);
  const mods = useRegistryStore((s) => s.mods);

  const handleLinkClick = (link: CommunityLink) => {
    if ('action' in link && link.action === 'credits') {
      setShowCredits(true);
    } else if ('href' in link && link.href) {
      BrowserOpenURL(link.href);
    }
  };
  return (
    <footer className="pb-5 pt-6 sm:pb-7 sm:pt-8">
      <div className={cn(APP_SHELL_WIDTH_CLASS, APP_SHELL_PADDING_CLASS)}>
        <div className="border-t border-border/60 pt-4">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {version || 'Unknown Version'}
          </p>

          <div className="mt-2.5">
            <div className="flex items-center justify-center gap-2.5">
              {COMMUNITY_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.id}
                    type="button"
                    intent="plain"
                    size="sm"
                    onClick={() => handleLinkClick(link)}
                    aria-label={link.label}
                    className="gap-2 text-muted-foreground hover:text-primary font-semibold"
                  >
                    <Icon className="size-5" />
                    <span>{link.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <RailyardCreditsModal
        open={showCredits}
        onOpenChange={setShowCredits}
        maps={maps}
        mods={mods}
      />
    </footer>
  );
}
