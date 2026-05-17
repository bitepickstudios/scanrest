"use client";

import { create } from "zustand";

export type OrderNotification = {
  id: string;
  orderNumber: number;
  customerName: string | null;
  source: string | null;
  createdAt: string;
  read: boolean;
};

interface OrderNotificationsState {
  items: OrderNotification[];
  newOrderCount: number;
  push: (n: Omit<OrderNotification, "read">) => void;
  bump: () => void;
  reset: () => void;
  markAllRead: () => void;
}

export const useOrderNotifications = create<OrderNotificationsState>((set) => ({
  items: [],
  newOrderCount: 0,
  push: (n) =>
    set((s) => ({
      items: [{ ...n, read: false }, ...s.items].slice(0, 20),
      newOrderCount: s.newOrderCount + 1,
    })),
  bump: () => set((s) => ({ newOrderCount: s.newOrderCount + 1 })),
  reset: () => set({ newOrderCount: 0 }),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((i) => ({ ...i, read: true })),
      newOrderCount: 0,
    })),
}));
