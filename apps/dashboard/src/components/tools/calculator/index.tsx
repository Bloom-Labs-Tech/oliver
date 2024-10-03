"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { PermissionCalculatorComponent } from "~/components/ui/permission-calculator";
import { PermissionToolPresets } from "./presets";

export default function PermissionTool() {
  const [permissions, setPermissions] = useState(0n);

  return (
    <div className="flex flex-col lg:flex-row h-fit w-full gap-4 lg:gap-10">
      {/* Left Section - Permission Calculator */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <PermissionCalculatorComponent
          permissions={permissions}
          className="w-full"
          onPermissionChange={setPermissions}
        >
          <div className="flex flex-col w-full gap-1">
            <h2 className="text-2xl font-bold">Permission Calculator</h2>
            <p className="text-gray-400">
              Calculate the permissions integer for Discord permissions.
            </p>
          </div>
        </PermissionCalculatorComponent>
      </div>

      {/* Right Section - Title and Presets */}
      <div className="flex flex-col gap-2 order-1 lg:order-2">
        <PermissionToolPresets
          permissions={permissions}
          setPermissions={setPermissions}
        />
        <div className="flex flex-col gap-2">
          <Link
            href="https://discord.com/developers/docs/topics/permissions"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="lg" className="w-full bg-gray-50/10">
              Discord Permissions Documentation
            </Button>
          </Link>
          <Link
            href="https://npmjs.com/package/@bloomlabs/permission-calculator"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="primary" size="lg" className="w-full">
              @bloomlabs/permission-calculator
            </Button>
          </Link>
          <Link
            href="httpss://npmjs.com/package/@bloomlabs/permission-calculator-react"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="primary" size="lg" className="w-full">
              @bloomlabs/permission-calculator-react
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
