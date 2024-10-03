import type { IconProps } from "@radix-ui/react-icons/dist/types";
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { create } from "zustand";

export type SidebarItems = {
  name: string;
  items: SidebarItem[];
}

export type SidebarItem = {
  name: string;
  icon: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>> | ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  href: string;
  openInNewTab?: boolean;
}

export type GlobalState = {
  width: number;
  height: number;
  scrollY: number;
  isMounted: boolean;
  items: SidebarItems[];
};

export type GlobalActions = {
  updateWindowSize: (width: number, height: number) => void;
  updateScrollY: (scrollY: number) => void;
  setMounted: (isMounted: boolean) => void;
  setItems: (items: SidebarItems[]) => void;
};

export type WindowStore = GlobalState & GlobalActions;

export const defaultGlobalState: GlobalState = {
  width: 0,
  height: 0,
  scrollY: 0,
  isMounted: false,
  items: [],
};

export const createGlobalStore = (initState: GlobalState = defaultGlobalState) => {
  return create<WindowStore>((set) => ({
    ...initState,
    updateWindowSize: (width: number, height: number) => {
      set({ width, height, scrollY: window.scrollY });
    },
    updateScrollY: (scrollY: number) => {
      set({ width: window.innerWidth, height: window.innerHeight, scrollY });
    },
    setMounted: (isMounted: boolean) => {
      set({ isMounted });
    },
    setItems: (items: SidebarItems[]) => {
      set({ items });
    },
  }));
};