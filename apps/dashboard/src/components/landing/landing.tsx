"use client";

import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function LandingSection() {
  return (
    <section className="text-center flex flex-col justify-center items-center h-full">
      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        Meet Oliver
        <br />
        Your All-in-One Discord Companion
      </h1>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Oliver is your go-to Discord bot for effortless server management. With
        powerful tools and an easy-to-use dashboard, Oliver makes it easy to
        keep your community organized and fun.
      </p>
      <div className="flex justify-center space-x-4">
        <Button className="w-48" variant="secondary" size="lg">
          Discover More
        </Button>
        <Button className="w-48" size="lg">
          See Documentation
        </Button>
      </div>
      <div className="mt-8 flex justify-center space-x-4">
        <Link href="https://discord.gg/Q5deNkpPRP" target="_blank">
          <Button variant="ghost" size="icon">
            <DiscordLogoIcon className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="https://github.com/Bloom-Labs-Tech/oliver" target="_blank">
          <Button variant="ghost" size="icon">
            <GitHubLogoIcon className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="mailto:support@bloomlabs.me" target="_blank">
          <Button variant="ghost" size="icon">
            <Mail className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
