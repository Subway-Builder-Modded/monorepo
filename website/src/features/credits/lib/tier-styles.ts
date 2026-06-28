import { CodeXml, UsersRound, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CreditsSubsectionId } from "./types";

export type TierStyle = {
  icon: LucideIcon;
  accentLight: string;
  accentDark: string;
};

export const TIER_STYLES: Record<CreditsSubsectionId, TierStyle> = {
  developer: { icon: CodeXml, accentLight: "#5296D5", accentDark: "#5296D5" },
  collaborator: { icon: UsersRound, accentLight: "#925CB1", accentDark: "#925CB1" },
  executive: { icon: Heart, accentLight: "#D8833B", accentDark: "#D8833B" },
  conductor: { icon: Heart, accentLight: "#9F2757", accentDark: "#9F2757" },
  engineer: { icon: Heart, accentLight: "#D65745", accentDark: "#D65745" },
};

export function getTierStyle(id: CreditsSubsectionId): TierStyle {
  return TIER_STYLES[id];
}
