import type { ReactNode } from "react";
import {
  Spoiler as SharedSpoiler,
  MdxDetails,
  MdxSummary,
  SPOILER_DETAILS_CLASS,
  SPOILER_SUMMARY_CLASS,
  SPOILER_BODY_CLASS,
} from "@subway-builder-modded/mdx";
import { resolveLucideIcon as resolveIcon } from "@/features/content/lib/icon-resolver";

type SpoilerProps = {
  title?: ReactNode;
  icon?: ReactNode | string;
  children?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function Spoiler({ title, icon, children, defaultOpen, className }: SpoilerProps) {
  return (
    <SharedSpoiler
      title={title}
      icon={icon}
      resolveIcon={resolveIcon}
      defaultOpen={defaultOpen}
      className={className}
    >
      {children}
    </SharedSpoiler>
  );
}

export { MdxDetails, MdxSummary, SPOILER_DETAILS_CLASS, SPOILER_SUMMARY_CLASS, SPOILER_BODY_CLASS };
