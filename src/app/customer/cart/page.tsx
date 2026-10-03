"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { useCart } from "@/context/cart-context";

export default function CustomerCartPage() {
  const {
    items,
    subtotal,
    itemCount,
    hydrated,
    updateQuantity,
    removeItem,
  } = useCart();

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/customer/services"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Continue shopping
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Your Cart
          </h1>

          <p className="mt-2 text-muted-foreground">
            {itemCount === 0
              ? "Your cart is empty."
              : `${itemCount} service${
                  itemCount === 1 ? "" : "s"
                } selected`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-background p-12 text-center">
            <ShoppingCart className="mx-auto size-12 text-muted-foreground" />

            <h2 className="mt-5 text-xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Browse our services and add the services you need.
            </p>

            <Link
              href="/customer/services"
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border bg-background p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.serviceName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="size-7 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.category}
                          </p>

                          <h2 className="mt-1 font-semibold">
                            {item.serviceName}
                          </h2>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.variantName}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="inline-flex items-center rounded-lg border">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="p-2.5 hover:bg-muted"
                          >
                            <Minus className="size-4" />
                          </button>

                          <span className="min-w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="p-2.5 hover:bg-muted"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            ₹
                            {item.price.toLocaleString(
                              "en-IN"
                            )}{" "}
                            each
                          </p>

                          <p className="font-semibold">
                            ₹
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border bg-background p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Services
                  </span>
                  <span>{itemCount}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>

                    <span>
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/customer/booking"
                className="mt-6 flex w-full justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Proceed to Booking
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}