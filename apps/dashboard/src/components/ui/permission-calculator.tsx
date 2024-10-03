"use client";

import { PermissionFlags } from "@bloomlabs/permission-calculator";
import { usePermissionCalculator } from "@bloomlabs/permission-calculator-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

type PermissionCalculatorProps = {
  permissions?: bigint;
  onPermissionChange?: (permissions: bigint) => void;
  className?: string;
  children?: React.ReactNode;
};

export function PermissionCalculatorComponent({
  permissions: defaultPermissions = 0n,
  onPermissionChange,
  className,
  children,
}: PermissionCalculatorProps) {
  const {
    addPermission,
    hasPermission,
    permissions,
    removePermission,
    setPermissions,
  } = usePermissionCalculator(defaultPermissions);

  useEffect(() => {
    onPermissionChange?.(permissions);
  }, [onPermissionChange, permissions]);

  useEffect(() => {
    setPermissions(defaultPermissions);
  }, [defaultPermissions, setPermissions]);

  const togglePermission = useCallback(
    (permission: bigint) => {
      if (hasPermission(permission)) {
        removePermission(permission);
      } else {
        addPermission(permission);
      }

      onPermissionChange?.(permissions);
    },
    [
      addPermission,
      hasPermission,
      removePermission,
      onPermissionChange,
      permissions,
    ]
  );

  return (
    <div
      className={cn(
        "max-w-[800px] flex flex-wrap gap-2 justify-center items-center bg-gray-950/60 shadow border p-4 rounded-lg",
        className
      )}
    >
      {children}
      <div className="w-full">
        <Label htmlFor="permissions">Permissions</Label>
        <Input
          id="permissions"
          value={permissions.toString()}
          onChange={(e) => {
            const oldPermissions = permissions;
            const value = e.target.value;
            try {
              setPermissions(BigInt(value));
            } catch {
              setPermissions(oldPermissions);
            }
          }}
        />
      </div>

      {Object.entries(PermissionFlags)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => (
          <Button
            className="flex-1 w-full border"
            key={name}
            variant={hasPermission(value) ? "secondary" : "outline"}
            onClick={() => togglePermission(value)}
          >
            {name
              .toLowerCase()
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")}
          </Button>
        ))}
    </div>
  );
}
