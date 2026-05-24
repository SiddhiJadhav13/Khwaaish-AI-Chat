import { create } from "zustand";
import type { ChatMessage } from "@/types";

type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setTyping: (value: boolean) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setTyping: (value) => set({ isTyping: value }),
  reset: () => set({ messages: [] }),
}));
