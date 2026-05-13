import { create } from "zustand";
import type { Product, Modifier, ModifierGroup } from "@/lib/types";

export interface CartModifier {
  id: string;
  name: string;
  price_delta: number;
}

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  selectedModifiers: CartModifier[];
  note: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (
    product: Product,
    selectedModifiers: CartModifier[],
    quantity: number,
    note: string
  ) => void;
  updateItem: (
    key: string,
    product: Product,
    selectedModifiers: CartModifier[],
    quantity: number,
    note: string
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateNote: (key: string, note: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem(product, selectedModifiers, quantity, note) {
    const key = `${product.id}-${selectedModifiers.map((m) => m.id).sort().join(",")}`;
    set((state) => {
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return {
        items: [...state.items, { key, product, quantity, selectedModifiers, note }],
      };
    });
  },

  updateItem(key, product, selectedModifiers, quantity, note) {
    const newKey = `${product.id}-${selectedModifiers.map((m) => m.id).sort().join(",")}`;
    set((state) => {
      const idx = state.items.findIndex((i) => i.key === key);
      if (idx === -1) return state;
      if (newKey !== key) {
        const merged = state.items.find((i) => i.key === newKey);
        if (merged) {
          return {
            items: state.items
              .filter((i) => i.key !== key)
              .map((i) =>
                i.key === newKey
                  ? { ...i, quantity: i.quantity + quantity, note }
                  : i
              ),
          };
        }
      }
      return {
        items: state.items.map((i, n) =>
          n === idx
            ? { key: newKey, product, quantity, selectedModifiers, note }
            : i
        ),
      };
    });
  },

  removeItem(key) {
    set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
  },

  updateQuantity(key, quantity) {
    if (quantity <= 0) {
      get().removeItem(key);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    }));
  },

  updateNote(key, note) {
    set((state) => ({
      items: state.items.map((i) => (i.key === key ? { ...i, note } : i)),
    }));
  },

  clear() {
    set({ items: [] });
  },

  totalItems() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  totalPrice() {
    return get().items.reduce((sum, i) => {
      const modifiersTotal = i.selectedModifiers.reduce(
        (s, m) => s + m.price_delta,
        0
      );
      return sum + (i.product.price + modifiersTotal) * i.quantity;
    }, 0);
  },
}));
