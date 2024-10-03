"use client";

import { LockClosedIcon } from "@radix-ui/react-icons";
import {
  Bell,
  Globe,
  Layers2,
  Layers3,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useGlobalStore } from "~/providers/globalStoreProvider";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "Room Management",
    description:
      "Effortlessly manage multiple chat rooms across different servers, keeping your conversations organized and accessible.",
    icon: <Users className="h-12 w-12 mb-4" />,
  },
  {
    title: "Smart Notifications",
    description:
      "Receive intelligent notifications that keep you informed without overwhelming you.",
    icon: <Bell className="h-12 w-12 mb-4" />,
  },
  {
    title: "Enhanced Security",
    description:
      "Advanced security features to keep your chats safe and private.",
    icon: <Shield className="h-12 w-12 mb-4" />,
  },
  {
    title: "Quick Actions",
    description:
      "Perform common tasks with lightning speed using our intuitive quick actions.",
    icon: <Zap className="h-12 w-12 mb-4" />,
  },
  {
    title: "Multiple Server Chat",
    description:
      "Connect and chat across multiple servers simultaneously, breaking down communication barriers.",
    icon: <Server className="h-12 w-12 mb-4" />,
  },
  {
    title: "Customizable Permissions",
    description:
      "Set custom permissions for users and roles to control access to features and channels.",
    icon: <Layers2 className="h-12 w-12 mb-4" />,
  },
  {
    title: "Advanced Moderation Tools",
    description:
      "Keep your server safe and friendly with advanced moderation tools and features.",
    icon: <LockClosedIcon className="h-12 w-12 mb-4" />,
  },
  {
    title: "Customizable Interfaces",
    description:
      "Tailor the interface to your needs with our flexible customization options.",
    icon: <Layers3 className="h-12 w-12 mb-4" />,
  },
  {
    title: "Global Reach",
    description:
      "Connect with users worldwide, breaking down language barriers with built-in translation.",
    icon: <Globe className="h-12 w-12 mb-4" />,
  },
];

export function Features() {
  return (
    <section className="grid justify-center items-center h-full">
      <div className="grid grid-rows-3 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:mx-36 lg:mx-24 md:mx-16 mx-8 2xl:mx-40">
        {features.map((feature) => (
          <Feature key={`feature-${feature.title}`} {...feature} />
        ))}
      </div>
    </section>
  );
}

function Feature({ title, description, icon }: Feature) {
  const width = useGlobalStore((s) => s.width);

  return (
    <div className="bg-gray-800 bg-opacity-30 rounded-lg p-6 relative">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {width >= 1024 && <p className="text-gray-300">{description}</p>}
    </div>
  );
}
