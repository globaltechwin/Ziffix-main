"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  id: string;
  serviceId: string;
  variantId?: string;
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
    item: Omit<
      CartItem,
      "serviceName" | "category" | "quantity"
    > & {
      name: string;
    },
    serviceName: string,
    category?: string
  ) => void;

  updateQuantity: (
    id: string,
    quantity: number
  ) => void;

  removeItem: (
    id: string
  ) => void;

  clearCart: () => void;
}

const STORAGE_KEY = "ziffix-cart";

const listeners = new Set<() => void>();

/* =========================================================
   STORAGE
========================================================= */

function getStoredCart(): string {
  if (typeof window === "undefined") {
    return "[]";
  }

  return (
    window.localStorage.getItem(STORAGE_KEY) ??
    "[]"
  );
}

function getServerSnapshot(): string {
  return "[]";
}

/* =========================================================
   SUBSCRIBE
========================================================= */

function subscribe(
  callback: () => void
) {
  listeners.add(callback);

  const handleStorage = (
    event: StorageEvent
  ) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    listeners.delete(callback);

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}

/* =========================================================
   NOTIFY
========================================================= */

function notifyCartChange() {
  listeners.forEach(
    (listener) => listener()
  );
}

/* =========================================================
   SAVE
========================================================= */

function saveCart(
  items: CartItem[]
) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );

    notifyCartChange();
  } catch (error) {
    console.error(
      "Failed to save cart:",
      error
    );
  }
}

/* =========================================================
   PARSE
========================================================= */

function parseCart(
  value: string
): CartItem[] {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error(
      "Failed to parse cart:",
      error
    );
  }

  return [];
}

/* =========================================================
   CONTEXT
========================================================= */

const CartContext =
  createContext<CartContextValue | undefined>(
    undefined
  );

/* =========================================================
   PROVIDER
========================================================= */

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * useSyncExternalStore guarantees that the
   * server and first client render use the same
   * snapshot.
   */
  const snapshot =
    useSyncExternalStore(
      subscribe,
      getStoredCart,
      getServerSnapshot
    );

  const items = useMemo(
    () => parseCart(snapshot),
    [snapshot]
  );

  /*
   * Do NOT use:
   *
   * typeof window !== "undefined"
   *
   * here.
   *
   * That causes server/client HTML differences.
   */
  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /* =======================================================
     ADD ITEM
  ======================================================= */

  const addItem = useCallback(
    (
      item: Omit<
        CartItem,
        "serviceName" |
          "category" |
          "quantity"
      > & {
        name: string;
      },
      serviceName: string,
      category = "Home Services"
    ) => {
      const currentItems =
        parseCart(
          getStoredCart()
        );

      const existing =
        currentItems.find(
          (entry) =>
            entry.id === item.id
        );

      let updatedItems: CartItem[];

      if (existing) {
        updatedItems =
          currentItems.map(
            (entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    quantity:
                      entry.quantity + 1,
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
            variantName:
              item.name,
            quantity: 1,
          },
        ];
      }

      saveCart(updatedItems);
    },
    []
  );

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  const updateQuantity =
    useCallback(
      (
        id: string,
        quantity: number
      ) => {
        const currentItems =
          parseCart(
            getStoredCart()
          );

        if (quantity <= 0) {
          saveCart(
            currentItems.filter(
              (item) =>
                item.id !== id
            )
          );

          return;
        }

        saveCart(
          currentItems.map(
            (item) =>
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

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeItem =
    useCallback(
      (id: string) => {
        const currentItems =
          parseCart(
            getStoredCart()
          );

        saveCart(
          currentItems.filter(
            (item) =>
              item.id !== id
          )
        );
      },
      []
    );

  /* =======================================================
     CLEAR CART
  ======================================================= */

  const clearCart =
    useCallback(() => {
      saveCart([]);
    }, []);

  /* =======================================================
     ITEM COUNT
  ======================================================= */

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [items]
  );

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.price *
            item.quantity,
        0
      ),
    [items]
  );

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

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

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}