"use client";

import Image from "next/image";
import { useGlobalStore } from "~/providers/globalStoreProvider";

export function Loading({
  children,
}: Readonly<{ children?: React.ReactNode }>) {
  const isMounted = useGlobalStore((state) => state.isMounted);

  if (isMounted) {
    return children;
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Image
        src="/assets/images/icons/android-chrome-192x192.png"
        className="rotate-ccw"
        width={192}
        height={192}
        alt="Loading..."
      />
    </div>
  );
}
