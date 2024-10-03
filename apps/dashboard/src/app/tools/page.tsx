"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

const tools = [
  {
    title: "Calculator",
    href: "/tools/calculator",
    description: "Discord permission calculator for role management.",
  },
  {
    title: "Embed Builder",
    href: "/tools/embed",
    description: "Create beautiful embeds for your Discord.",
  },
];

export default function Page() {
  const [open, setOpen] = useState<0 | 1 | 2>(0); // 0 = closed, 1 = calculator, 2 = embed

  const handleOpenChange = useCallback(
    (isOpen: boolean, idx: number) => {
      if (isOpen) {
        setOpen((idx + 1) as 1 | 2);
      } else {
        if (idx !== open - 1) return;
        setOpen(0);
      }
    },
    [open]
  );

  return (
    <div className="grid grid-cols-2 items-center h-full gap-4">
      {tools.map((tool, idx) => (
        <ToolCard
          {...tool}
          idx={idx}
          key={`tool-${tool.title}`}
          setOpen={handleOpenChange}
          isOpen={open === idx + 1}
        />
      ))}
    </div>
  );
}

function ToolCard({
  title,
  href,
  description,
  idx,
  setOpen,
  isOpen,
}: (typeof tools)[0] & {
  idx: number;
  setOpen: (isOpen: boolean, idx: number) => void;
  isOpen: boolean;
}) {
  return (
    <HoverCard
      openDelay={0.5}
      onOpenChange={(open) => setOpen(open, idx)}
      open={isOpen}
    >
      <HoverCardTrigger asChild>
        <Link href={href} passHref>
          <div className="flex items-center space-x-2 bg-gray-950 p-6 justify-center rounded-lg">
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-gray-400 text-sm">{description}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
