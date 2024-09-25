"use client";

import Image from "next/image";
import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="relative container mx-auto px-4 py-8 mt-24 border-t border-gray-800 z-10">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Image
            src="/assets/images/icons/icon-192x192.png"
            alt="Oliver logo"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <span className="text-2xl font-bold">oliver</span>
        </div>
        <p className="text-sm text-gray-400 mb-4 md:mb-0">
          © 2024 Bloomlabs. All rights reserved.
        </p>
        <nav className="flex space-x-4">
          <a href="/" className="text-sm hover:text-gray-300">
            Privacy
          </a>
          <Separator orientation="vertical" className="h-5" />
          <a href="/" className="text-sm hover:text-gray-300">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
