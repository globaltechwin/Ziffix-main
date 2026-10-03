"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  category: string;
  variantName: string;
  price: number;
  originalPrice?: number;
  duration: string;
  image?: string;
  description?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (
    item: Omit<CartItem, "serviceName" | "category" | "quantity"> & {
      name: string;
    },
    serviceName: string,
    category?: string
  ) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "ziffix-cart";

const listeners = new Set<() => void>();

function getStoredCart(): string {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyCartChange() {
  listeners.forEach((listener) => listener());
}

function saveCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );

    notifyCartChange();
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

function parseCart(value: string): CartItem[] {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse cart:", error);
  }

  return [];
}

const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getStoredCart,
    getServerSnapshot
  );

  const items = useMemo(
    () => parseCart(snapshot),
    [snapshot]
  );

  const hydrated = typeof window !== "undefined";

  const addItem = useCallback(
    (
      item: Omit<CartItem, "serviceName" | "category" | "quantity"> & {
        name: string;
      },
      serviceName: string,
      category = "Home Services"
    ) => {
      const currentItems = parseCart(getStoredCart());

      const existing = currentItems.find(
        (entry) => entry.id === item.id
      );

      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = currentItems.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: entry.quantity + 1,
              }
            : entry
        );
      } else {
        updatedItems = [
          ...currentItems,
          {
            ...item,
            serviceName,
            category,
            variantName: item.name,
            quantity: 1,
          },
        ];
      }

      saveCart(updatedItems);
    },
    []
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      const currentItems = parseCart(getStoredCart());

      if (quantity <= 0) {
        saveCart(
          currentItems.filter((item) => item.id !== id)
        );
        return;
      }

      saveCart(
        currentItems.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity,
              }
            : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    const currentItems = parseCart(getStoredCart());

    saveCart(
      currentItems.filter((item) => item.id !== id)
    );
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}