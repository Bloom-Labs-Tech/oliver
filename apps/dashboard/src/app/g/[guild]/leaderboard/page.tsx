import { GuildLeaderboard } from "~/components/dashboard/leaderboard";

export default function Page({ params }: { params: { guild: string } }) {
  return <GuildLeaderboard guildId={params.guild} />;
}
