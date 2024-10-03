"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import { useGuild } from "~/hooks/useGuilds";
import { useLeaderboard } from "~/hooks/useLeaderboard";
import { cn, formatNumberWithSuffix } from "~/lib/utils";

type GuildLeaderboardProps = {
  guildId: string;
};

export function GuildLeaderboard({ guildId }: GuildLeaderboardProps) {
  const { data: guild } = useGuild(guildId);
  const { data: leaderboard } = useLeaderboard(guildId);

  return (
    <div className="h-full justify-center items-center flex w-fit mx-auto space-y-6 p-6">
      <Card className="bg-gray-950/25 text-white">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Avatar className="w-20 h-20 mx-auto mb-2">
              <AvatarImage
                src={guild?.icon ?? "/assets/images/icons/oliver.png"}
                alt={guild?.name}
              />
              <AvatarFallback>
                {guild?.name[0]}
                {guild?.name[1]}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{guild?.name}</h2>
            <p className="text-sm opacity-75">{guild?.memberCount} members</p>
          </div>

          <div className="flex justify-between items-end mb-8">
            {leaderboard.members.slice(0, 3).map((player, idx) => (
              <div
                key={`player-leaderboard-${player.rank}`}
                className={cn("text-center bg-gray-950/20 p-4 w-56", {
                  "order-first": idx === 1,
                })}
              >
                <Avatar
                  className={cn(
                    "mx-auto mb-2 border-4 relative overflow-visible",
                    {
                      "w-24 h-24 border-yellow-500": idx === 0,
                      "w-20 h-20 border-blue-500": idx === 1,
                      "w-20 h-20 border-green-500": idx === 2,
                    }
                  )}
                >
                  <div
                    className={cn(
                      "absolute w-5 h-5 -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full flex justify-center items-center",
                      {
                        "bg-yellow-500": idx === 0,
                        "bg-blue-500": idx === 1,
                        "bg-green-500": idx === 2,
                      }
                    )}
                  >
                    <span className="text-xs font-semibold">{player.rank}</span>
                  </div>
                  <AvatarImage
                    src={
                      player.image ??
                      "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png"
                    }
                    className="rounded-full"
                    alt={player.nickname}
                  />
                  <AvatarFallback className="rounded-full">
                    {player.nickname[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="font-semibold">{player.nickname}</div>
                <div className="text-sm opacity-75">@{player.tag}</div>
                <div
                  className={cn(
                    "mt-1 flex flex-col items-center justify-center text-center w-full",
                    {
                      "text-yellow-500": idx === 0,
                      "text-blue-500": idx === 1,
                      "text-green-500": idx === 2,
                    }
                  )}
                >
                  <span className="font-medium text-sm">
                    Level {player.level}
                  </span>
                  <span className="text-sm opacity-75">
                    {formatNumberWithSuffix(player.xp)} XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {leaderboard.members.slice(3, 7).map((player) => (
              <div
                key={`player-leaderboard-${player.rank}`}
                className="flex items-center bg-black bg-opacity-30 rounded-lg p-3"
              >
                <div className="w-10 text-center font-bold">{player.rank}</div>
                <Avatar className="w-10 h-10 mx-2">
                  <AvatarImage
                    src={
                      player.image ??
                      "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png"
                    }
                    alt={player.nickname}
                  />
                  <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="font-semibold">{player.nickname}</div>
                  <div className="text-sm opacity-75">@{player.tag}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Level {player.level}</div>
                  <div className="text-sm opacity-75">{player.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
