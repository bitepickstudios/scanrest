"use client";

import { create } from "zustand";

interface OrderNotificationsState {
  newOrderCount: number;
  bump: () => void;
  reset: () => void;
}

export const useOrderNotifications = create<OrderNotificationsState>((set) => ({
  newOrderCount: 0,
  bump: () => set((s) => ({ newOrderCount: s.newOrderCount + 1 })),
  reset: () => set({ newOrderCount: 0 }),
}));
