"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
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

export default function CustomerSubscriptionsPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [downgrading, setDowngrading] = useState<string | null>(null);

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

  const handleDowngrade = async (targetPlan: string) => {
    setDowngrading(targetPlan);

    try {
      const res = await fetch("/api/customer/subscription", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: targetPlan,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Failed to change plan");
        return;
      }

      if (data?.scheduled) {
        toast.success(data.message);
      } else {
        setCurrentPlan(targetPlan);

        toast.success(
          `Switched to ${
            targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)
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
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-background">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Crown className="size-7" />
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Ziffix Membership
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose Your Plan
          </h1>

          <p className="mt-3 text-muted-foreground">
            Select the plan that best fits your home service needs.
          </p>
        </div>

        {/* Trust information */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium">
            <ShieldCheck className="size-4 text-emerald-600" />
            Flexible plans
          </div>

          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium">
            <Check className="size-4 text-emerald-600" />
            Easy upgrades
          </div>

          <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium">
            <Zap className="size-4 text-amber-500" />
            Fast service booking
          </div>
        </div>

        {/* Plans */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {subscriptionPlans.map((plan, index) => {
            const Icon = iconMap[plan.icon] || Star;

            const isCurrent = currentPlan === plan.id;

            const isLower =
              planOrder[plan.id] < planOrder[currentPlan];

            const isPaid = plan.id !== "free";

            return (
              <motion.div
                key={plan.id}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                className={`relative flex flex-col rounded-3xl border-2 bg-card p-6 shadow-sm transition hover:shadow-lg ${
                  isCurrent
                    ? "border-primary shadow-primary/10"
                    : "border-border"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow">
                    Current Plan
                  </div>
                )}

                {plan.id === "pro" && (
                  <div className="absolute right-5 top-5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Most Popular
                  </div>
                )}

                <div
                  className={`flex size-14 items-center justify-center rounded-2xl ${plan.bg}`}
                >
                  <Icon className={`size-7 ${plan.color}`} />
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  {plan.name}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
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

                <div className="my-6 h-px bg-border" />

                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan includes
                </p>

                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="size-3 text-emerald-700" />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {isCurrent ? (
                    <div className="rounded-xl border bg-muted px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
                      Current Plan
                    </div>
                  ) : isLower ? (
                    <button
                      type="button"
                      onClick={() => handleDowngrade(plan.id)}
                      disabled={downgrading === plan.id}
                      className="w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                    >
                      {downgrading === plan.id ? (
                        <Loader2 className="mx-auto size-5 animate-spin" />
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Pay Manually
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Manual payment notice */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-950">
            <ShieldCheck className="size-4" />
            Manual Payment
          </div>

          <p className="mt-2 text-xs leading-5 text-blue-800">
            Paid membership plans use Bank Transfer, Google Pay, or the
            Ziffix QR code. After payment, keep your UTR or transaction
            reference for manual verification.
          </p>
        </div>
      </div>
    </div>
  );
}
