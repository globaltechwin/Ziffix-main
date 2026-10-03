"use client";

import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "@/context/cart-context";

export function BottomCartBar() {
  const router = useRouter();

  const {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
  } = useCart();

  const handleAdd = (item: (typeof items)[number]) => {
    addItem(
      {
        id: item.id,
        serviceId: item.serviceId,
        variantId: item.variantId,
        name: item.variantName,
        variantName: item.variantName,
        price: item.price,
        originalPrice: item.originalPrice,
        duration: item.duration,
        image: item.image,
        description: item.description,
      },
      item.serviceName,
      item.category,
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Cart */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <ShoppingCart className="size-6 text-primary" />

            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </div>

          {itemCount > 0 ? (
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-medium">
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"} in cart
              </p>

              <div className="mt-1 flex max-w-xl flex-col gap-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="truncate">
                      {item.serviceName}
                      {item.variantName &&
                        item.variantName !== item.serviceName
                        ? ` — ${item.variantName}`
                        : ""}{" "}
                      × {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="rounded p-1 hover:bg-muted hover:text-destructive"
                      aria-label={`Remove ${item.serviceName}`}
                    >
                      <Minus className="size-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAdd(item)
                      }
                      className="rounded p-1 hover:bg-muted hover:text-primary"
                      aria-label={`Add another ${item.serviceName}`}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your cart is empty
            </p>
          )}
        </div>

        {/* Total + Continue */}
        <div className="flex items-center gap-4">
          {itemCount > 0 && (
            <div className="hidden text-right sm:block">
              <p className="text-xs text-muted-foreground">
                Total
              </p>

              <p className="text-lg font-bold">
                ₹{subtotal.toLocaleString("en-IN")}
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={itemCount === 0}
            onClick={() =>
              router.push("/customer/booking")
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue

            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BottomCartBar;