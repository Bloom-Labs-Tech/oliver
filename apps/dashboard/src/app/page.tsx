"use client";

import { useOliverAPI } from "@oliver/api/react";
import { Role } from "@oliver/api/types";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { PermissionCalculator } from "~/components/ui/permission-calculator";
import { cn, parseBigInt } from "~/lib/utils";

export default function Page() {
  const [role, setRole] = useState<Role | null>(null);

  const { data, loading, error } = useOliverAPI(
    "guilds",
    "getRoles",
    {
      fetchOnMount: true,
    },
    "1285614396181184605"
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Role not found</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-4 h-screen justify-center">
      <h1 className="text-4xl">Permission Calculator</h1>
      <p className="text-lg">Select a role to view its permissions</p>
      <div className="flex items-center space-x-4">
        <PermissionCalculator permissions={parseBigInt(role?.permissions)} />

        <ul className="space-y-2 max-h-[580px] overflow-y-auto p-4 bg-card rounded-lg">
          {data.map((r) => (
            <li key={r.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full",
                  r.id === role?.id && "bg-accent hover:bg-gray-50/30"
                )}
                onClick={() => setRole(r)}
              >
                {r.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
