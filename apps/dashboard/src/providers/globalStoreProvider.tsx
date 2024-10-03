"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useStore } from "zustand";
import { items } from "~/lib/sidebar-items";

import { type WindowStore, createGlobalStore } from "~/stores/globalStore";

export type GlobalStoreApi = ReturnType<typeof createGlobalStore>;

export const globalStoreContext = createContext<GlobalStoreApi | null>(null);

export interface GlobalStoreProviderProps {
  children: ReactNode;
}

export const GlobalStoreProvider = ({ children }: GlobalStoreProviderProps) => {
  const pathname = usePathname();

  const storeRef = useRef<GlobalStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createGlobalStore();
  }

  useEffect(() => {
    storeRef.current?.setState((state) => ({
      ...state,
      items: items(pathname),
    }));
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      storeRef.current?.setState((state) => ({
        ...state,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      storeRef.current?.setState((state) => ({
        ...state,
        scrollY: document.getElementById("main")?.scrollTop || 0,
      }));
    };

    const mainElement = document.getElementById("main");
    mainElement?.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      mainElement?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    storeRef.current?.getState().setMounted(true);
  }, []);

  return (
    <globalStoreContext.Provider value={storeRef.current}>
      {children}
    </globalStoreContext.Provider>
  );
};

export const useGlobalStore = <T,>(selector: (store: WindowStore) => T): T => {
  const store = useContext(globalStoreContext);
  if (!store) {
    throw new Error("useWindowStore must be used within a WindowStoreProvider");
  }
  return useStore(store, selector);
};
