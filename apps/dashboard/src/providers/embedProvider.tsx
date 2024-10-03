"use client";

import { type ReactNode, createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

import { type EmbedStore, createEmbedStore } from "~/stores/embedStore";

export type EmbedStoreApi = ReturnType<typeof createEmbedStore>;

export const EmbedStoreContext = createContext<EmbedStoreApi | null>(null);

export interface EmbedStoreProviderProps {
  children: ReactNode;
}

export const EmbedStoreProvider = ({ children }: EmbedStoreProviderProps) => {
  const storeRef = useRef<EmbedStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createEmbedStore();
  }

  return (
    <EmbedStoreContext.Provider value={storeRef.current}>
      {children}
    </EmbedStoreContext.Provider>
  );
};

export const useEmbedStore = <T,>(selector: (store: EmbedStore) => T): T => {
  const store = useContext(EmbedStoreContext);
  if (!store) {
    throw new Error("useEmbedStore must be used within a EmbedStoreProvider");
  }
  return useStore(store, selector);
};
