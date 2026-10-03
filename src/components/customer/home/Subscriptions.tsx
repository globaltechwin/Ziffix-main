"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { subscriptionPlans } from "@/lib/constants";
import { toast } from "sonner";

const iconMap: Record<string, typeof Star> = {
  Star,
  Zap,
  Crown,
};

const planOrder: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

export function Subscriptions() {
  const [currentPlan, setCurrentPlan] =
    useState<string>("free");

  const [downgrading, setDowngrading] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/customer/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.plan) {
          setCurrentPlan(data.plan);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleDowngrade = async (
    targetPlan: string
  ) => {
    setDowngrading(targetPlan);

    try {
      const res = await fetch(
        "/api/customer/subscription",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: targetPlan,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          data?.error ||
            "Failed to change plan"
        );
        return;
      }

      if (data?.scheduled) {
        toast.success(data.message);
      } else {
        setCurrentPlan(targetPlan);

        toast.success(
          `Switched to ${
            targetPlan.charAt(0).toUpperCase() +
            targetPlan.slice(1)
          } plan`
        );
      }
    } catch {
      toast.error("Failed to change plan");
    } finally {
      setDowngrading(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Crown className="size-4 text-amber-500" />

            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Ziffix Membership
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Choose your plan
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Get more value from every home service
          </p>
        </div>

        <Link
          href="/customer/subscriptions"
          className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex"
        >
          View plans
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {subscriptionPlans.map(
          (plan, index) => {
            const Icon =
              iconMap[plan.icon] || Star;

            const isCurrent =
              currentPlan === plan.id;

            const isLower =
              planOrder[plan.id] <
              planOrder[currentPlan];

            const isPaid =
              plan.id !== "free";

            return (
              <motion.div
                key={plan.id}
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.08,
                }}
                className={`relative flex flex-col rounded-2xl border-2 bg-background p-5 ${
                  isCurrent
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Current plan
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl ${plan.bg}`}
                  >
                    <Icon
                      className={`size-5 ${plan.color}`}
                    />
                  </div>

                  {plan.id === "pro" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      PREMIUM
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {plan.name}
                </h3>

                <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0
                      ? "Free"
                      : `₹${plan.price}`}
                  </span>

                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features
                    .slice(0, 4)
                    .map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />

                        <span>{feature}</span>
                      </li>
                    ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <div className="rounded-xl border bg-muted px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground">
                      Current Plan
                    </div>
                  ) : isLower ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDowngrade(
                          plan.id
                        )
                      }
                      disabled={
                        downgrading ===
                        plan.id
                      }
                      className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                    >
                      {downgrading ===
                      plan.id ? (
                        <Loader2 className="mx-auto size-4 animate-spin" />
                      ) : (
                        "Downgrade"
                      )}
                    </button>
                  ) : isPaid ? (
                    <Link
                      href={`/customer/payment?type=subscription&plan=${encodeURIComponent(
                        plan.id
                      )}&amount=${encodeURIComponent(
                        String(plan.price)
                      )}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Pay Manually
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );
}
