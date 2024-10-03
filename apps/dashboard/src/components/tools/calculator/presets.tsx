"use client";

import {
  PermissionCalculator,
  PermissionFlagResolvable,
  PermissionFlags,
} from "@bloomlabs/permission-calculator";
import { SetStateAction } from "react";
import { Button } from "~/components/ui/button";

type PermissionToolPresetsProps = {
  permissions: bigint;
  setPermissions: (value: SetStateAction<bigint>) => void;
};
export function PermissionToolPresets({
  permissions,
  setPermissions,
}: PermissionToolPresetsProps) {
  return (
    <div className="hidden lg:flex flex-col gap-2 bg-gray-950/60 p-6 rounded-lg ">
      <h2 className="text-xl font-bold">Presets</h2>
      <p className="text-sm text-gray-400">
        Click on a preset to toggle the permissions.
      </p>
      {Object.entries(presets).map(([name, presetPermissions]) => (
        <Button
          key={name}
          variant={
            permissions ===
            PermissionCalculator.parsePermissions(presetPermissions)
              ? "secondary"
              : "outline"
          }
          onClick={() =>
            setPermissions((prev) => {
              const preset =
                PermissionCalculator.parsePermissions(presetPermissions);
              return prev === preset ? 0n : preset;
            })
          }
        >
          {name
            .split("_")
            .map((part) => part[0].toUpperCase() + part.slice(1))
            .join(" ")}
        </Button>
      ))}
    </div>
  );
}

const presets: Record<string, PermissionFlagResolvable> = {
  admin: PermissionFlags.ADMINISTRATOR,
  moderator: [
    PermissionFlags.KICK_MEMBERS,
    PermissionFlags.BAN_MEMBERS,
    PermissionFlags.MANAGE_MESSAGES,
    PermissionFlags.MANAGE_CHANNELS,
    PermissionFlags.MUTE_MEMBERS,
    PermissionFlags.DEAFEN_MEMBERS,
    PermissionFlags.MOVE_MEMBERS,
    PermissionFlags.MANAGE_EVENTS,
    PermissionFlags.MODERATE_MEMBERS,
    PermissionFlags.VIEW_AUDIT_LOG,
    PermissionFlags.MANAGE_THREADS,
  ],
  member: [
    PermissionFlags.CHANGE_NICKNAME,
    PermissionFlags.USE_EXTERNAL_EMOJIS,
    PermissionFlags.USE_EXTERNAL_SOUNDS,
    PermissionFlags.CREATE_INSTANT_INVITE,
    PermissionFlags.USE_EXTERNAL_STICKERS,
    PermissionFlags.ADD_REACTIONS,
    PermissionFlags.CREATE_PUBLIC_THREADS,
  ],
  streamer: [
    PermissionFlags.STREAM,
    PermissionFlags.PRIORITY_SPEAKER,
    PermissionFlags.SPEAK,
  ],
  event_organizer: [
    PermissionFlags.MANAGE_EVENTS,
    PermissionFlags.CREATE_EVENTS,
    PermissionFlags.SEND_MESSAGES,
    PermissionFlags.EMBED_LINKS,
  ],
  thread_moderator: [
    PermissionFlags.MANAGE_THREADS,
    PermissionFlags.CREATE_PUBLIC_THREADS,
    PermissionFlags.CREATE_PRIVATE_THREADS,
    PermissionFlags.SEND_MESSAGES_IN_THREADS,
    PermissionFlags.MODERATE_MEMBERS,
  ],
  none: 0n,
};
