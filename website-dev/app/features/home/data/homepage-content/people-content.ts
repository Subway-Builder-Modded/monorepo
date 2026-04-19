import type { PeopleDestination } from "./types";

export const PEOPLE_SECTION = {
  title: "Built by the community, for the community",
  description:
    "Run completely by the community, for the community. Join us in building the future of modding for Subway Builder.",
} as const;

export const PEOPLE_DESTINATIONS: PeopleDestination[] = [
  {
    id: "community",
    icon: "discord",
    title: "Community",
    description:
      "Get support, share feedback, show off your creations, and help shape the roadmap alongside other builders.",
    href: "/community",
    label: "Community Hub",
  },
  {
    id: "credits",
    icon: "users",
    title: "Credits",
    description: "The maintainers, collaborators, and contributors who keep us moving forward.",
    href: "/credits",
    label: "View Credits",
  },
  {
    id: "contribute",
    icon: "heart",
    title: "Contribute",
    description:
      "Support ongoing development and help ship new features faster while keeping everything free and open for everyone.",
    href: "/contribute",
    label: "Support the Project",
  },
];
