import { useQuery } from "@tanstack/react-query";
import { env } from "~/env";

type Member = {
  id: string;
  tag: string;
  rank: number;
  nickname: string;
  level: number;
  xp: number;
  image: string | null;
};

type LeaderboardResponse = {
  total: number;
  page: number;
  limit: number;
  members: Member[];
};


const fetchLeaderboard = async (guildId: string): Promise<LeaderboardResponse> => {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/guilds/${guildId}/leaderboard`, {
    credentials: "include",
    referrerPolicy: "no-referrer",
  });
  return res.json();
}

function useLeaderboard(guildId: string) {
  return useQuery<LeaderboardResponse>({
    queryKey: ["guilds", "leaderboard", guildId],
    queryFn: () => fetchLeaderboard(guildId),
    initialData: { total: 0, page: 1, limit: 10, members: [] }
  });
}

export { fetchLeaderboard, useLeaderboard };

