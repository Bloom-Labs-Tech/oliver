import { useQuery } from "@tanstack/react-query";
import { env } from "~/env";

export type Guild = {
  id: string;
  name: string;
  icon: string;
  banner: string;
  isOwner: boolean;
  permissions: string;
  canManage: boolean;
  hasBot: boolean;
};

export type GuildWithData = Guild & {
  memberCount: number;
  settings: {
    COMMANDS: {
      isEnabled: boolean;
      data: {
        about: boolean;
        cooldown: boolean;
        help: boolean;
        leaderboard: boolean;
        level: boolean;
        ping: boolean;
        purge: boolean;
        reload: boolean;
        ticket: boolean;
        verify: boolean;
      };
    };
    INVITES: {
      isEnabled: boolean;
      data: Record<string, never>; // empty object
    };
    TICKETS: {
      isEnabled: boolean;
      data: {
        categoryId: string;
      };
    };
    LEVELING: {
      isEnabled: boolean;
      data: {
        channelId: string;
        roles: {
          level: number;
          id: string;
        }[];
      };
    };
    VOICE: {
      isEnabled: boolean;
      data: {
        categoryId: string;
        channelId: string;
      };
    };
    WELCOME: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    GOODBYE: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    AUTOROLE: {
      isEnabled: boolean;
      data: {
        roles: string[];
      };
    };
    LEGENDOFMUSHROOM: {
      isEnabled: boolean;
      data: {
        verification: {
          isEnabled: boolean;
          categoryId: string;
          roles: string[];
        };
      };
    };
    ANNOUNCEMENTS: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    SUGGESTIONS: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    MODERATION: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    CUSTOM_COMMANDS: {
      isEnabled: boolean;
      data: {
        commands: {
          name: string;
          response: string;
        }[];
      };
    };
    ECONOMY: {
      isEnabled: boolean;
      data: Record<string, never>; // empty object
    };
    EVENTS: {
      isEnabled: boolean;
      data: {
        channelId: string;
        events: {
          name: string;
          description: string;
          date: string;
        }[];
      };
    };
    GIVEAWAYS: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    LOGS: {
      isEnabled: boolean;
      data: {
        channelId: string;
      };
    };
    REACTION_ROLES: {
      isEnabled: boolean;
      data: {
        roles: {
          emoji: string;
          roleId: string;
        }[];
      };
    };
    REMINDERS: {
      isEnabled: boolean;
      data: {
        channelId: string;
        reminders: {
          name: string;
          description: string;
          date: string;
        }[];
      };
    };
  };
};

const fetchGuilds = async (): Promise<Guild[]> => {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/guilds/me`, {
    credentials: "include",
    referrerPolicy: "no-referrer",
  });
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Failed to fetch guilds");
  }
  return data;
}

function useGuilds() {
  return useQuery<Guild[]>({
    queryKey: ["guilds", "me"],
    queryFn: fetchGuilds,
    initialData: []
  });
}

const fetchGuild = (id: string): Promise<GuildWithData> => {
  return fetch(`${env.NEXT_PUBLIC_API_URL}/guilds/${id}`, {
    credentials: "include",
    referrerPolicy: "no-referrer",
  }).then((res) => res.json());
}

function useGuild(id: string) {
  return useQuery<GuildWithData>({
    queryKey: ["guild", id],
    queryFn: () => fetchGuild(id),
  });
}

export { fetchGuild, fetchGuilds, useGuild, useGuilds };

