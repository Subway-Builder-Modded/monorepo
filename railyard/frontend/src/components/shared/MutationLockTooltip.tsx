import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@subway-builder-modded/shared-ui';
import type { ReactNode } from 'react';

import {
  DisabledReasonTooltipContent,
  gameRunningReason,
} from '@/components/shared/IncompatibilityTooltip';

// MutationLockTooltip explains a control disabled by the game-session lock. While locked it
// wraps children (via a span, since disabled buttons swallow pointer events) with the shared
// lock-reason tooltip; otherwise it renders children untouched.
export function MutationLockTooltip({
  locked,
  reason,
  title,
  children,
}: {
  locked: boolean;
  reason?: string;
  title: string;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent>
          <DisabledReasonTooltipContent
            title={title}
            reasons={[gameRunningReason(reason)]}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
