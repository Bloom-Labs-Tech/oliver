"use client";

import { PermissionFlags } from "@bloomlabs/permission-calculator";
import { usePermissionCalculator } from "@bloomlabs/permission-calculator-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type PermissionCalculatorProps = {
  permissions?: bigint;
  onPermissionChange?: (permissions: bigint) => void;
};

export function PermissionCalculatorComponent({
  permissions: defaultPermissions = 0n,
  onPermissionChange,
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
    <div className="max-w-[800px] flex flex-wrap gap-2 justify-center items-center bg-card border p-4 rounded-lg">
      <div className="w-full">
        <Label htmlFor="permissions">Permissions</Label>
        <Input id="permissions" value={permissions.toString()} disabled />
      </div>

      {Object.entries(PermissionFlags)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => (
          <Button
            className="flex-1 w-full"
            key={name}
            variant={hasPermission(value) ? "secondary" : "default"}
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
