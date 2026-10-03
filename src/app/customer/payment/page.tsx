"use client";

import {
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  Building2,
  Check,
  Clipboard,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  QrCode,
} from "lucide-react";

import { toast } from "sonner";

import {
  PAYMENT_DETAILS,
} from "@/lib/payment-details";

export default function CustomerPaymentPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const type =
    searchParams.get("type") ||
    "subscription";

  const plan =
    searchParams.get("plan") ||
    "starter";

  const amount =
    Number(
      searchParams.get("amount") ||
        0
    );

  const [paymentMethod, setPaymentMethod] =
    useState<
      "bank" | "gpay" | "qr"
    >("bank");

  const [paymentReference, setPaymentReference] =
    useState("");

  const [copied, setCopied] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  /* =========================================================
     FORMAT
  ========================================================= */

  const formattedAmount =
    `₹${amount.toLocaleString(
      "en-IN"
    )}`;

  const formattedPlan =
    plan.charAt(0).toUpperCase() +
    plan.slice(1);

  /* =========================================================
     COPY
  ========================================================= */

  const copyValue = async (
    value: string,
    label: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch {
      toast.error(
        "Unable to copy"
      );
    }
  };

  /* =========================================================
     SUBMIT PAYMENT
  ========================================================= */

  const handleSubmitPayment =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      const reference =
        paymentReference.trim();

      if (!reference) {
        toast.error(
          "Please enter your UTR / transaction reference"
        );

        return;
      }

      if (reference.length < 6) {
        toast.error(
          "Please enter a valid UTR / transaction reference"
        );

        return;
      }

      if (
        type !== "subscription"
      ) {
        toast.error(
          "Invalid payment type"
        );

        return;
      }

      if (
        !["starter", "pro"].includes(
          plan
        )
      ) {
        toast.error(
          "Invalid subscription plan"
        );

        return;
      }

      setSubmitting(true);

      try {
        const response =
          await fetch(
            "/api/customer/subscription",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  plan,

                  paymentMethod,

                  paymentReference:
                    reference,
                }),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to submit payment"
          );
        }

        toast.success(
          "Payment submitted for verification"
        );

        /*
         * Move to the confirmation page.
         */
        router.replace(
          data?.redirectTo ||
            `/customer/payment/success?plan=${encodeURIComponent(
              plan
            )}&amount=${encodeURIComponent(
              String(amount)
            )}`
        );
      } catch (error) {
        console.error(
          "Submit subscription payment error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to submit payment"
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =========================================================
     PAYMENT METHOD
  ========================================================= */

  const methods = [
    {
      id: "bank" as const,
      title: "Bank Transfer",
      description:
        "Pay directly to the Ziffix bank account.",
      icon: (
        <Building2 className="size-5 text-blue-600" />
      ),
    },

    {
      id: "gpay" as const,
      title: "Google Pay",
      description:
        "Pay using the Ziffix GPay number.",
      icon: (
        <Smartphone className="size-5 text-blue-600" />
      ),
    },

    {
      id: "qr" as const,
      title: "QR Code",
      description:
        "Scan the Ziffix payment QR code.",
      icon: (
        <QrCode className="size-5 text-blue-600" />
      ),
    },
  ];

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/customer/subscriptions"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to subscriptions
            </Link>

            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual Payment
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Complete your {formattedPlan} membership payment.
            </p>
          </div>

          <div className="rounded-2xl border bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Amount to pay
            </p>

            <p className="mt-1 text-2xl font-bold text-primary">
              {formattedAmount}
            </p>
          </div>
        </div>

        {/* =====================================================
            LAYOUT
        ===================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ===================================================
              LEFT
          =================================================== */}

          <div className="space-y-6">
            {/* PAYMENT METHODS */}

            <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="font-semibold">
                  Choose payment method
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pay exactly {formattedAmount}.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {methods.map(
                  (method) => {
                    const active =
                      paymentMethod ===
                      method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            method.id
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                            : "hover:border-primary/40"
                        }`}
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                          {method.icon}
                        </div>

                        <p className="mt-3 font-semibold">
                          {method.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {method.description}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            {/* BANK */}

            {paymentMethod ===
              "bank" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Building2 className="size-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Bank Transfer
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Transfer exactly{" "}
                      {formattedAmount}{" "}
                      to the account below.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <PaymentDetail
                    label="Account Name"
                    value={
                      PAYMENT_DETAILS
                        .bank
                        .accountName
                    }
                    onCopy={() =>
                      copyValue(
                        PAYMENT_DETAILS
                          .bank
                          .accountName,
                        "accountName"
                      )
                    }
                    copied={
                      copied ===
                      "accountName"
                    }
                  />

                  <PaymentDetail
                    label="Bank Name"
                    value={
                      PAYMENT_DETAILS
                        .bank
                        .bankName
                    }
                    onCopy={() =>
                      copyValue(
                        PAYMENT_DETAILS
                          .bank
                          .bankName,
                        "bankName"
                      )
                    }
                    copied={
                      copied ===
                      "bankName"
                    }
                  />

                  <PaymentDetail
                    label="Account Number"
                    value={
                      PAYMENT_DETAILS
                        .bank
                        .accountNumber
                    }
                    onCopy={() =>
                      copyValue(
                        PAYMENT_DETAILS
                          .bank
                          .accountNumber,
                        "accountNumber"
                      )
                    }
                    copied={
                      copied ===
                      "accountNumber"
                    }
                  />

                  <PaymentDetail
                    label="IFSC"
                    value={
                      PAYMENT_DETAILS
                        .bank
                        .ifsc
                    }
                    onCopy={() =>
                      copyValue(
                        PAYMENT_DETAILS
                          .bank
                          .ifsc,
                        "ifsc"
                      )
                    }
                    copied={
                      copied ===
                      "ifsc"
                    }
                  />
                </div>
              </section>
            )}

            {/* GPAY */}

            {paymentMethod ===
              "gpay" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Smartphone className="size-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Google Pay
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Send exactly{" "}
                      {formattedAmount}{" "}
                      to the Ziffix GPay number.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border bg-slate-50 p-5">
                  <p className="text-xs text-muted-foreground">
                    GPAY NUMBER
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-xl font-bold tracking-wide">
                      {
                        PAYMENT_DETAILS
                          .gpay
                          .number
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyValue(
                          PAYMENT_DETAILS
                            .gpay
                            .number,
                          "gpay"
                        )
                      }
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                      <Clipboard className="size-4" />

                      {copied ===
                      "gpay"
                        ? "Copied"
                        : "Copy"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* QR */}

            {paymentMethod ===
              "qr" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <QrCode className="size-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      QR Code
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Scan the QR code and pay{" "}
                      {formattedAmount}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-center rounded-2xl border bg-white p-6">
                  <img
                    src={
                      PAYMENT_DETAILS
                        .qr
                        .image
                    }
                    alt={
                      PAYMENT_DETAILS
                        .qr
                        .alt
                    }
                    className="size-64 max-w-full rounded-xl object-contain"
                  />
                </div>
              </section>
            )}

            {/* REFERENCE */}

            <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CreditCard className="size-5 text-emerald-600" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Payment reference
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the UTR or transaction reference after completing the payment.
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  handleSubmitPayment
                }
                className="mt-5"
              >
                <label
                  htmlFor="paymentReference"
                  className="text-sm font-medium"
                >
                  UTR / Transaction ID
                </label>

                <input
                  id="paymentReference"
                  type="text"
                  value={
                    paymentReference
                  }
                  onChange={(event) =>
                    setPaymentReference(
                      event.target.value
                    )
                  }
                  placeholder="Enter UTR or transaction reference"
                  disabled={
                    submitting
                  }
                  autoComplete="off"
                  className="mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  This reference will be sent to the administrator for manual verification.
                </p>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Manual verification
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Your subscription will remain pending until an administrator verifies the payment.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !paymentReference.trim()
                  }
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-5" />
                      Submit Payment for Verification
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* ===================================================
              RIGHT SUMMARY
          =================================================== */}

          <aside className="h-fit rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">
              Payment Summary
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Plan
                </span>

                <span className="font-semibold">
                  {formattedPlan}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Billing
                </span>

                <span className="font-semibold">
                  Monthly
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-primary">
                    {formattedAmount}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="size-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Manual verification
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      Your payment reference will be reviewed before the membership is activated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/customer/subscriptions"
              className="mt-5 block text-center text-sm font-medium text-primary hover:underline"
            >
              Cancel and return
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PAYMENT DETAIL
========================================================= */

function PaymentDetail({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 break-all font-semibold">
            {value}
          </p>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="size-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
