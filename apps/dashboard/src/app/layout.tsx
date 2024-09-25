import type { Metadata } from "next";
import { Footer } from "~/components/footer";
import { Navbar } from "~/components/navbar";
import Providers from "~/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oliver",
  description:
    "The Oliver Dashboard offers seamless server management with a user-friendly interface and powerful automation tools. Designed for Discord communities, Oliver provides advanced moderation, customizable settings, and real-time analytics, all in a sleek, pastel-themed dashboard. Simplify your Discord server experience with Oliver—efficient, intuitive, and built to grow with your community.",
  manifest: "/manifest.json",
  icons: [
    {
      url: "/assets/images/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/assets/images/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  appleWebApp: {
    capable: true,
    startupImage: "/assets/images/icons/icon-512x512.png",
    statusBarStyle: "black",
    title: "Oliver",
  },
  applicationName: "Oliver",
  authors: [
    {
      name: "Bloomlabs",
      url: "https://bloomlabs.me",
    },
  ],
  keywords: [
    "discord",
    "bot",
    "dashboard",
    "server",
    "management",
    "community",
    "moderation",
    "automation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body className="antialiased">
          <Navbar />
          {children}
          <Footer />
        </body>
      </html>
    </Providers>
  );
}
