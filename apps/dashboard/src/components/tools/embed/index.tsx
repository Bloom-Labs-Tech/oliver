"use client";

import { useEmbedStore } from "~/providers/embedProvider";
import DiscordView from "./components/discordview";
import { EmbedBuilder } from "./input";

export function EmbedBuilderComponent() {
  const content = useEmbedStore((state) => state.content);
  const embeds = useEmbedStore((state) => state.embeds);

  return (
    <div className="grid grid-cols-6 items-center p-4 space-x-4 w-full min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden">
      <EmbedBuilder />
      <DiscordView
        data={{
          content,
          embeds,
        }}
        username="𝖔𝖑𝖎𝖛𝖊𝖗"
        avatar_url="/assets/images/icons/icon-128x128.png"
      />
    </div>
  );
}
