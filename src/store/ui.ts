import { create } from "zustand";
import type { Mood } from "@/types";

type UIState = {
  isCartOpen: boolean;
  activeMood?: Mood;
  activeBudget?: number;
  requestedItems: string[];
  setCartOpen: (value: boolean) => void;
  setActiveMood: (mood?: Mood) => void;
  setActiveBudget: (budget?: number) => void;
  addRequestedItem: (item: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  activeMood: undefined,
  activeBudget: undefined,
  requestedItems: [],
  setCartOpen: (value) => set({ isCartOpen: value }),
  setActiveMood: (mood) => set({ activeMood: mood }),
  setActiveBudget: (budget) => set({ activeBudget: budget }),
  addRequestedItem: (item) => set((state) => ({
    requestedItems: state.requestedItems.includes(item)
      ? state.requestedItems
      : [...state.requestedItems, item]
  })),
}));
