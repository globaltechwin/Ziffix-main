"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";

export function BottomCartBar() {
  const router = useRouter();

  const { items, addItem, removeItem } = useCart();

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleAddAnother = (item: (typeof items)[number]) => {
    const {
      category: _category,
      serviceName: _serviceName,
      quantity: _quantity,
      ...cartItem
    } = item;

    addItem(
      {
        ...cartItem,
        name: item.variantName,
      },
      item.serviceName
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Cart summary */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <ShoppingCart className="size-6 text-primary" />

            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>

          {totalItems > 0 ? (
            <>
              <div className="hidden min-w-0 sm:block">
                <p className="text-sm font-medium text-foreground">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in cart
                </p>

                <div className="flex max-w-xl flex-col gap-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="max-w-[420px] truncate">
                        {item.serviceName} — {item.variantName} x{item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${item.variantName}`}
                      >
                        <Minus className="size-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddAnother(item)}
                        className="shrink-0 text-muted-foreground hover:text-primary"
                        aria-label={`Add another ${item.variantName}`}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:hidden">
                <p className="text-sm font-medium text-foreground">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your cart is empty
            </p>
          )}
        </div>

        {/* Total + Continue */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {totalItems > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">
                ₹{totalPrice}
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="px-5 font-semibold sm:px-6"
            disabled={totalItems === 0}
            onClick={() => router.push("/customer/cart")}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}