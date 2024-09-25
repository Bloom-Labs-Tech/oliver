"use client";

import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuthStore } from "~/providers/authStoreProvider";

export function Navbar() {
  const status = useAuthStore((store) => store.status);
  const login = useAuthStore((store) => store.login);

  return (
    <header className="relative container mx-auto px-4 py-6 flex justify-between items-center z-10">
      <div className="flex items-center space-x-2">
        <Image
          src="/assets/images/icons/icon-192x192.png"
          alt="Oliver logo"
          width={64}
          height={64}
          className="rounded-lg"
        />
        <span className="text-2xl font-bold">oliver</span>
      </div>
      <nav className="hidden md:flex space-x-6">
        <a href="/" className="hover:text-gray-300">
          about us
        </a>
        <a href="/" className="hover:text-gray-300">
          features
        </a>
        <a href="/" className="hover:text-gray-300">
          status
        </a>
        <a href="/" className="hover:text-gray-300">
          discover rooms
        </a>
      </nav>
      {status === "authenticated" ? (
        <div className="items-center space-x-4 hidden md:inline-flex">
          <Button variant="ghost">Dashboard</Button>
          <UserDropdown />
        </div>
      ) : (
        <Button className="hidden md:inline-flex" onClick={login}>
          Login
        </Button>
      )}
    </header>
  );
}

function UserDropdown() {
  const user = useAuthStore((store) => store.session?.user);
  const logout = useAuthStore((store) => store.logout);
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-0 w-fit h-fit rounded-full"
        >
          <Avatar>
            <AvatarImage src={user.image} alt={user.username} />
            <AvatarFallback>
              {user.username[0]}
              {user.username[1]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={logout}
            className="hover:!bg-destructive/80 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
