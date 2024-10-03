import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Hash } from "lucide-react";
import type { SidebarItems } from "~/stores/globalStore";

const homeItems: SidebarItems[] = [
  {
    name: "/",
    items: [
      {
        name: "welcome",
        icon: Hash,
        href: "/",
      },
      {
        name: "features",
        icon: Hash,
        href: "/features",
      },
      {
        name: "dashboard",
        icon: Hash,
        href: "/dashboard",
      },
      {
        name: "stats",
        icon: Hash,
        href: "/stats",
      },
    ],
  },
  {
    name: "links",
    items: [
      {
        name: "GitHub",
        href: "https://github.com/bloom-labs-tech/oliver",
        icon: GitHubLogoIcon,
        openInNewTab: true,
      },
      {
        name: "Discord",
        href: "https://discord.gg/3u3rJq3",
        icon: DiscordLogoIcon,
        openInNewTab: true,
      },
    ],
  },
];

const guildItems = (guildId: string) => [
  {
    name: "Home",
    items: [
      {
        name: "Dashboard",
        icon: Hash,
        href: `/g/${guildId}`,
      },
    ],
  },
  {
    name: "Leveling",
    items: [
      {
        name: "Leaderboard",
        icon: Hash,
        href: `/g/${guildId}/leaderboard`,
      },
    ],
  },
];

export const items = (pathname: string): SidebarItems[] => {
  if (
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/dashboard" ||
    pathname === "/stats"
  ) {
    return homeItems;
  }

  if (pathname.startsWith("/g/")) {
    const guildId = pathname.split("/")[2];
    return guildItems(guildId);
  }

  return [];
};
