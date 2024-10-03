"use client";

import Link from "next/link";

// import "~/styles/codemirror-one-dark.css";
// import "~/styles/discord.css";
// import "~/styles/tachyons.css";

// import { EmbedBuilderComponent } from "~/components/tools/embed";
// import { EmbedStoreProvider } from "~/providers/embedProvider";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold">Discord Embed Builder</h1>
      <p className="text-lg text-gray-200">
        Coming soon! This tool will allow you to create custom Discord embeds
        with ease.
      </p>
      <div className="mt-4">
        <h2 className="text-lg">
          For now, you can use the{" "}
          <Link
            href="https://glitchii.github.io/embedbuilder/?data=JTdCJTdE"
            target="_blank"
            referrerPolicy="no-referrer"
          >
            <span className="underline cursor-pointer">Embed Builder</span>
          </Link>
          .
        </h2>
      </div>
    </div>
  );
}
