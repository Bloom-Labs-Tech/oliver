"use client";

import { useGlobalStore } from "~/providers/globalStoreProvider";
import Iphone15Pro from "../magicui/iphone-15-pro";
import Safari from "../magicui/safari";

export function DashboardSection() {
  const isMobile = useGlobalStore((state) => state.width < 768);

  return (
    <section className="w-full h-full grid justify-center items-center">
      {isMobile ? (
        <Iphone15Pro
          className="w-full h-[700px]"
          src="https://via.assets.so/img.jpg?w=300&h=600&tc=white&bg=%2325255f&t=bloomlabs"
        />
      ) : (
        <Safari
          className="mx-40 h-full"
          url="oliver.bloomlabs.me/g/1285614396181184605"
          src="https://via.assets.so/img.jpg?w=1600&h=800&tc=white&bg=%2325255f&t=bloomlabs"
        />
      )}
    </section>
  );
}
