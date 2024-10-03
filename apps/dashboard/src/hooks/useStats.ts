import { useQuery } from "@tanstack/react-query";
import { env } from "~/env";

type Stats = {
  serversJoined: number;
  roomsCreated: number;
  messagesSent: number;
};

const fetchStats = async (): Promise<Stats> => {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/stats`);
  return res.json();
}

function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    initialData: {
      serversJoined: 0,
      roomsCreated: 0,
      messagesSent: 0,
    },
  });
}

export { fetchStats, useStats };

