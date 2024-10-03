"use client";

import { ChevronDown, Lock, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { type Guild, useGuilds } from "~/hooks/useGuilds";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/providers/authStoreProvider";
import { useGlobalStore } from "~/providers/globalStoreProvider";
import type { SidebarItem } from "~/stores/globalStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function Sidebar() {
  const { data: guilds } = useGuilds();
  const pathname = usePathname();

  const items = useGlobalStore((state) => state.items);

  const user = useAuthStore((state) => state.session?.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-screen">
      <div className="w-[72px] bg-gray-900 p-3 flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        <Link href="/" passHref>
          <Avatar
            className={cn("h-12 w-12 bg-gray-700 hover:bg-indigo-500", {
              "rounded-2xl bg-indigo-500": pathname === "/",
              "sidebar-button": pathname !== "/",
            })}
            role="button"
            aria-label="Home"
          >
            <AvatarImage
              src="/assets/images/icons/android-chrome-192x192.png"
              alt={"Oliver Bot"}
              className={cn("rounded-none", {
                "rotate-ccw": pathname === "/",
              })}
            />
            <AvatarFallback className="bg-transparent">{"O"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="w-8 border-t border-gray-700 my-2" />
        {user &&
          guilds
            .filter((g) => g.canManage)
            .map((guild) => (
              <GuildButton
                key={guild.id}
                {...guild}
                selected={pathname.startsWith(`/g/${guild.id}`)}
              />
            ))}
        {user && (
          <Fragment>
            <div className="w-8 border-t border-gray-700 my-2" />
            {guilds
              .filter((g) => !g.canManage)
              .map((guild) => (
                <GuildButton
                  key={guild.id}
                  {...guild}
                  selected={pathname.startsWith(`/g/${guild.id}`)}
                />
              ))}
          </Fragment>
        )}
      </div>

      {/* Channel list */}
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="p-4 shadow-md">
          <h2 className="text-white font-bold">
            {guilds.find((guild) => pathname.startsWith(`/g/${guild.id}`))
              ?.name || "Oliver Bot"}
          </h2>
        </div>
        <ScrollArea className="flex-grow">
          {items.map((cat, catIdx) => (
            <div key={`category-${cat.name}`} className="p-2 space-y-0.5">
              <div className="flex items-center text-gray-400 px-2 mb-2">
                <ChevronDown className="h-3 w-3 mr-1" />
                <h3 className="uppercase text-xs font-semibold">{cat.name}</h3>
              </div>
              {Array.isArray(cat.items) &&
                cat.items.map((channel, idx) => (
                  <ItemButton
                    key={`item-${cat.name}-${idx}`}
                    {...channel}
                    idx={idx}
                    catIdx={catIdx}
                  />
                ))}
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 bg-gray-900 flex items-center gap-2">
          {user ? (
            <Fragment>
              <Avatar className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                <AvatarImage src={user?.image} alt={user?.username} />
                <AvatarFallback>{user?.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="text-white text-sm font-medium">
                  {user?.username}
                </div>
                <div className="text-gray-400 text-xs font-semibold truncate max-w-20">
                  {user?.email}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-red-500/80"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </Fragment>
          ) : (
            <Button
              variant="discord"
              className="w-full"
              onClick={() => login()}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function GuildButton(props: Guild & { selected: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          {props.selected && (
            <div className="h-12 w-1.5 absolute -left-3.5 bg-gray-200 rounded-r-xl rounded-l-none" />
          )}
          {!props.hasBot &&
            (props.canManage ? (
              <Link href={`/api/invite/${props.id}`} passHref>
                <div className="w-full h-full z-10 absolute flex justify-center items-center top-0 left-0 bg-gray-950/30 hover:bg-gray-950/50 transition-colors duration-200">
                  <Plus className="h-6 w-6 text-white" />
                </div>
              </Link>
            ) : (
              <div className="w-full h-full z-10 absolute flex justify-center items-center top-0 left-0 bg-gray-950/30 hover:bg-gray-950/50 transition-colors duration-200">
                <Lock className="h-6 w-6 text-white" />
              </div>
            ))}
          <Link href={`/g/${props.id}`} passHref>
            <Avatar
              className={cn("h-12 w-12 bg-gray-700 hover:bg-indigo-500", {
                "rounded-2xl bg-indigo-500": props.selected,
                "sidebar-button": !props.selected,
              })}
              role="button"
              aria-label={props.name}
            >
              <AvatarImage
                src={props.icon}
                alt={props.name}
                className="rounded-none"
              />
              <AvatarFallback className="bg-transparent">
                {props.name[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="py-3 font-medium">
        {props.hasBot
          ? props.name
          : props.canManage
          ? `Invite to ${props.name}`
          : `No Permissions in ${props.name}`}
      </TooltipContent>
    </Tooltip>
  );
}

function ItemButton(props: SidebarItem & { idx: number; catIdx: number }) {
  const pathname = usePathname();

  return (
    <Link
      href={props.href}
      passHref
      target={props.openInNewTab ? "_blank" : ""}
      rel="noopener noreferrer"
    >
      <Button
        key={`channel-${props.name}`}
        variant="ghost"
        className={cn(
          "w-full justify-start px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700",
          {
            "text-white bg-gray-700": pathname === props.href,
          }
        )}
      >
        <props.icon className="h-5 w-5 mr-2" />
        {props.name}
      </Button>
    </Link>
  );
}
