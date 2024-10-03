"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AuthStoreProvider } from "./authStoreProvider";
import { GlobalStoreProvider } from "./globalStoreProvider";

const queryClient = new QueryClient();

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStoreProvider>
        <AuthStoreProvider>
          <TooltipProvider delayDuration={50}>{children}</TooltipProvider>
        </AuthStoreProvider>
      </GlobalStoreProvider>
    </QueryClientProvider>
  );
}
