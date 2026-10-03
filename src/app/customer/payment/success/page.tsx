"use client";

import {
  CheckCircle2,
  Clock3,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import Link from "next/link";

import {
  useSearchParams,
} from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams =
    useSearchParams();

  const plan =
    searchParams.get("plan") ||
    "starter";

  const amount =
    Number(
      searchParams.get("amount") ||
        0
    );

  const formattedPlan =
    plan.charAt(0).toUpperCase() +
    plan.slice(1);

  const formattedAmount =
    `₹${amount.toLocaleString(
      "en-IN"
    )}`;

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-2xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border bg-white p-6 text-center shadow-sm sm:p-10">
          {/* SUCCESS ICON */}

          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-11 text-emerald-600" />
          </div>

          {/* TITLE */}

          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            Payment Submitted
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Your {formattedPlan} membership payment of{" "}
            <span className="font-semibold text-foreground">
              {formattedAmount}
            </span>{" "}
            has been submitted successfully.
          </p>

          {/* STATUS */}

          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
            <div className="flex gap-3">
              <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div>
                <p className="font-semibold text-amber-900">
                  Verification pending
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  An administrator will verify your UTR / transaction reference. Your membership will become active after the payment is verified.
                </p>
              </div>
            </div>
          </div>

          {/* DETAILS */}

          <div className="mt-5 rounded-2xl border bg-slate-50 p-5 text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" />

              <p className="font-semibold">
                Payment details
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-muted-foreground">
                  Plan
                </p>

                <p className="mt-1 font-semibold">
                  {formattedPlan}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-muted-foreground">
                  Amount
                </p>

                <p className="mt-1 font-semibold">
                  {formattedAmount}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Status
                </p>

                <p className="mt-1 font-semibold text-amber-600">
                  Pending Verification
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/customer/subscriptions"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              View Subscription
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/customer/home"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition hover:bg-slate-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
