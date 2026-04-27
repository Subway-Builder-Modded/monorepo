import { SITE_COMMUNITY_LINKS } from "@/config/site-navigation";

export type CommunityCardIconName = string;

export type CommunityValue = {
  icon: CommunityCardIconName;
  title: string;
  description: string;
};

export const COMMUNITY_VALUES: readonly CommunityValue[] = [
  {
    icon: "Wrench",
    title: "Modding Help",
    description:
      "Ask setup questions, troubleshoot issues, and get guidance from maintainers, creators, and other members of the community.",
  },
  {
    icon: "MessageSquare",
    title: "Community Feedback",
    description:
      "Be involved in shaping the future of Subway Builder Modded by sharing your thoughts, suggestions, and feedback on the latest project releases.",
  },
  {
    icon: "Bell",
    title: "Release Alerts",
    description:
      "Stay up-to-date with release announcements, hotfixes, and important announcements across Subway Builder Modded projects.",
  },
  {
    icon: "Sparkles",
    title: "Sneak Peeks",
    description:
      "View early previews of upcoming features and projects, and get involved in early testing opportunities to help shape development.",
  },
];

export const COMMUNITY_DISCORD_LINK =
  SITE_COMMUNITY_LINKS.find((link) => link.id === "discord")?.href ??
  "https://discord.gg/syG9YHMyeG";
