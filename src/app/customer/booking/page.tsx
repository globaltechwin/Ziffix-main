"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  QrCode,
  ShoppingCart,
  Smartphone,
  Building2,
  Copy,
  Loader2,
} from "lucide-react";

import { useCart } from "@/context/cart-context";
import { PAYMENT_DETAILS } from "@/lib/payment-details";

type Step = 1 | 2 | 3 | 4;

const TIME_SLOTS = [
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

export default function CustomerBookingPage() {
  const router = useRouter();

  const {
    items,
    subtotal,
    itemCount,
    hydrated,
    clearCart,
  } = useCart();

  const [activeStep, setActiveStep] = useState<Step>(1);

  const [address, setAddress] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] =
    useState(false);

  const minimumDate = useMemo(() => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(
      tomorrow.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      tomorrow.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const copyToClipboard = async (
    value: string,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch {
      setCopied("");
    }
  };

  /* =========================================================
     CREATE BOOKING
  ========================================================= */

  const handleConfirmBooking = async () => {
    if (isCreatingBooking) {
      return;
    }

    setError("");

    if (!address.trim()) {
      setError(
        "Please enter your complete service address.",
      );
      setActiveStep(1);
      return;
    }

    if (!serviceDate) {
      setError("Please select a service date.");
      setActiveStep(2);
      return;
    }

    if (!timeSlot) {
      setError("Please select a time slot.");
      setActiveStep(2);
      return;
    }

    if (!items.length) {
      setError(
        "Your cart is empty. Please add a service first.",
      );
      return;
    }

    setIsCreatingBooking(true);

    try {
      /*
       * The cart context stores the real service ID.
       * Send all cart items to the booking API.
       */
      const bookingItems = items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        name: item.serviceName,
        variantName: item.variantName,
        price: Number(item.price),
        quantity: Number(item.quantity),
        duration: item.duration,
      }));

      const response = await fetch(
        "/api/customer/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items: bookingItems,
            address: address.trim(),
            scheduledDate: serviceDate,
            scheduledTime: timeSlot,
            notes: notes.trim() || null,

            /*
             * This is a manual bank/GPay payment flow.
             * The booking/payment remains pending until
             * the payment is verified.
             */
            paymentMethod: "manual",
            transactionId: `MANUAL-${Date.now()}`,
          }),
        },
      );

      let result: {
        success?: boolean;
        bookingId?: string;
        paymentStatus?: string;
        error?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Booking failed (${response.status})`,
        );
      }

      if (!result.success || !result.bookingId) {
        throw new Error(
          result.error ||
            "Booking was not created. Please try again.",
        );
      }

      /*
       * Clear the cart only after the database booking
       * has been successfully created.
       */
      clearCart();

      /*
       * Go to the customer's booking list.
       */
      router.push("/customer/bookings");
    } catch (bookingError) {
      console.error(
        "Customer booking submission error:",
        bookingError,
      );

      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "Failed to create booking. Please try again.",
      );
    } finally {
      setIsCreatingBooking(false);
    }
  };

  /* =========================================================
     STEP VALIDATION
  ========================================================= */

  const handleAddressContinue = () => {
    setError("");

    if (!address.trim()) {
      setError(
        "Please enter your complete service address.",
      );
      return;
    }

    if (address.trim().length < 10) {
      setError(
        "Please enter a more complete service address.",
      );
      return;
    }

    setActiveStep(2);
  };

  const handleScheduleContinue = () => {
    setError("");

    if (!serviceDate) {
      setError("Please select a service date.");
      return;
    }

    if (!timeSlot) {
      setError("Please select a time slot.");
      return;
    }

    setActiveStep(3);
  };

  const handleReviewContinue = () => {
    setError("");
    setActiveStep(4);
  };

  const stepIsCompleted = (step: Step) => {
    return activeStep > step;
  };

  const stepIsActive = (step: Step) => {
    return activeStep === step;
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            Loading your booking...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (!items.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Add at least one service before continuing
            with your booking.
          </p>

          <Link
            href="/customer/services"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Browse Services

            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      {/* =====================================================
          BACK TO CART
      ===================================================== */}

      <Link
        href="/customer/cart"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to Cart
      </Link>

      {/* =====================================================
          PAGE HEADING
      ===================================================== */}

      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Complete Your Booking
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Enter your service address and choose your
          preferred date and time.
        </p>
      </div>

      {/* =====================================================
          STEP INDICATOR
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-4">
        <StepIndicator
          number={1}
          title="Address"
          subtitle="Service location"
          icon={<MapPin className="h-5 w-5" />}
          active={stepIsActive(1)}
          completed={stepIsCompleted(1)}
        />

        <StepIndicator
          number={2}
          title="Schedule"
          subtitle="Date & time"
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          active={stepIsActive(2)}
          completed={stepIsCompleted(2)}
        />

        <StepIndicator
          number={3}
          title="Review"
          subtitle="Confirm booking"
          icon={<FileText className="h-5 w-5" />}
          active={stepIsActive(3)}
          completed={stepIsCompleted(3)}
        />

        <StepIndicator
          number={4}
          title="Payment"
          subtitle="Bank / GPay"
          icon={<CreditCard className="h-5 w-5" />}
          active={stepIsActive(4)}
          completed={false}
        />
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          {/* =================================================
              STEP 1 - ADDRESS
          ================================================= */}

          {activeStep === 1 && (
            <section className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Service Address
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Where should our technician provide
                    the service?
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium"
                >
                  Full Address
                </label>

                <textarea
                  id="address"
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setError("");
                  }}
                  placeholder="House/Flat No., Street, Area, City, State, PIN"
                  rows={5}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Please provide enough detail so the
                  technician can easily locate your
                  property.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddressContinue}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Continue to Schedule

                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* =================================================
              STEP 2 - SCHEDULE
          ================================================= */}

          {activeStep === 2 && (
            <section className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Date & Time
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Choose when you want the service.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="service-date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Service Date
                  </label>

                  <input
                    id="service-date"
                    type="date"
                    min={minimumDate}
                    value={serviceDate}
                    onChange={(event) => {
                      setServiceDate(event.target.value);
                      setError("");
                    }}
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  <p className="mt-2 text-xs text-muted-foreground">
                    Services can be scheduled from
                    tomorrow onward.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="time-slot"
                    className="mb-2 block text-sm font-medium"
                  >
                    Time Slot
                  </label>

                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <select
                      id="time-slot"
                      value={timeSlot}
                      onChange={(event) => {
                        setTimeSlot(event.target.value);
                        setError("");
                      }}
                      className="w-full appearance-none rounded-xl border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">
                        Select a time slot
                      </option>

                      {TIME_SLOTS.map((slot) => (
                        <option
                          key={slot}
                          value={slot}
                        >
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm font-medium">
                      Service Address
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setActiveStep(1);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Back to Address
                </button>

                <button
                  type="button"
                  onClick={handleScheduleContinue}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Continue to Review

                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* =================================================
              STEP 3 - REVIEW
          ================================================= */}

          {activeStep === 3 && (
            <section className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Review Your Booking
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Check all booking details before
                    payment.
                  </p>
                </div>
              </div>

              {/* Address */}

              <div className="mb-5 rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />

                  <h3 className="text-sm font-semibold">
                    Service Address
                  </h3>
                </div>

                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {address}
                </p>
              </div>

              {/* Date and time */}

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />

                    <h3 className="text-sm font-semibold">
                      Service Date
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatDate(serviceDate)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />

                    <h3 className="text-sm font-semibold">
                      Time Slot
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {timeSlot}
                  </p>
                </div>
              </div>

              {/* Notes */}

              <div className="mb-5">
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium"
                >
                  Additional Instructions
                </label>

                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Any special requests or instructions for the technician..."
                  rows={4}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Optional.
                </p>
              </div>

              {/* Services */}

              <div className="rounded-xl border">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">
                    Selected Services
                  </h3>
                </div>

                <div className="divide-y">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.serviceName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.variantName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>

                    <span className="text-sm font-medium">
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-bold text-primary">
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setActiveStep(2);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Back to Schedule
                </button>

                <button
                  type="button"
                  onClick={handleReviewContinue}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Continue to Payment

                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* =================================================
              STEP 4 - PAYMENT
          ================================================= */}

          {activeStep === 4 && (
            <section className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Payment
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Pay the booking amount using Bank
                    Transfer or Google Pay.
                  </p>
                </div>
              </div>

              {/* Amount */}

              <div className="rounded-2xl border bg-muted/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Amount to Pay
                    </p>

                    <p className="mt-1 text-3xl font-bold text-primary">
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Bank transfer */}

              <div className="mt-5 rounded-2xl border p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Bank Transfer
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Transfer the exact booking amount
                      to this account.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <PaymentRow
                    label="Account Name"
                    value={
                      PAYMENT_DETAILS.bank
                        .accountName
                    }
                    onCopy={() =>
                      copyToClipboard(
                        PAYMENT_DETAILS.bank
                          .accountName,
                        "accountName",
                      )
                    }
                    copied={
                      copied === "accountName"
                    }
                  />

                  <PaymentRow
                    label="Account Number"
                    value={
                      PAYMENT_DETAILS.bank
                        .accountNumber
                    }
                    onCopy={() =>
                      copyToClipboard(
                        PAYMENT_DETAILS.bank
                          .accountNumber,
                        "accountNumber",
                      )
                    }
                    copied={
                      copied === "accountNumber"
                    }
                  />

                  <PaymentRow
                    label="IFSC Code"
                    value={
                      PAYMENT_DETAILS.bank.ifsc
                    }
                    onCopy={() =>
                      copyToClipboard(
                        PAYMENT_DETAILS.bank.ifsc,
                        "ifsc",
                      )
                    }
                    copied={copied === "ifsc"}
                  />

                  <PaymentRow
                    label="Bank Name"
                    value={
                      PAYMENT_DETAILS.bank.bankName
                    }
                    onCopy={() =>
                      copyToClipboard(
                        PAYMENT_DETAILS.bank
                          .bankName,
                        "bankName",
                      )
                    }
                    copied={
                      copied === "bankName"
                    }
                  />
                </div>
              </div>

              {/* GPay */}

              <div className="mt-5 rounded-2xl border p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <Smartphone className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Google Pay
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Send the exact amount using GPay.
                    </p>
                  </div>
                </div>

                <PaymentRow
                  label="GPay Number"
                  value={
                    PAYMENT_DETAILS.gpay.number
                  }
                  onCopy={() =>
                    copyToClipboard(
                      PAYMENT_DETAILS.gpay.number,
                      "gpay",
                    )
                  }
                  copied={copied === "gpay"}
                />
              </div>

              {/* QR */}

              <div className="mt-5 rounded-2xl border p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <QrCode className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Scan & Pay
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Scan the QR code using Google Pay
                      or another supported UPI app.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center rounded-xl bg-muted/30 p-5">
                  <img
                    src={PAYMENT_DETAILS.qr.image}
                    alt={
                      PAYMENT_DETAILS.qr.alt
                    }
                    className="h-64 w-64 rounded-xl object-contain"
                  />
                </div>
              </div>

              {/* Instructions */}

              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-semibold text-blue-900">
                  Payment Instructions
                </h3>

                <ol className="mt-3 space-y-2">
                  {PAYMENT_DETAILS.instructions.map(
                    (instruction, index) => (
                      <li
                        key={instruction}
                        className="flex gap-3 text-sm text-blue-800"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          {index + 1}
                        </span>

                        <span>
                          {instruction}
                        </span>
                      </li>
                    ),
                  )}
                </ol>
              </div>

              {/* Booking information */}

              <div className="mt-5 rounded-2xl border bg-muted/30 p-5">
                <h3 className="font-semibold">
                  Booking Information
                </h3>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Service Date
                    </p>

                    <p className="mt-1 font-medium">
                      {formatDate(serviceDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Time Slot
                    </p>

                    <p className="mt-1 font-medium">
                      {timeSlot}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Service Address
                    </p>

                    <p className="mt-1 whitespace-pre-wrap font-medium">
                      {address}
                    </p>
                  </div>

                  {notes.trim() && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Instructions
                      </p>

                      <p className="mt-1 whitespace-pre-wrap font-medium">
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* FINAL BUTTON */}

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isCreatingBooking}
                  onClick={() => {
                    if (!isCreatingBooking) {
                      setError("");
                      setActiveStep(3);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />

                  Back to Review
                </button>

                <button
                  type="button"
                  disabled={isCreatingBooking}
                  onClick={handleConfirmBooking}
                  className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Creating Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking

                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Your booking will be created as pending
                payment until Ziffix verifies the transfer.
              </p>
            </section>
          )}
        </div>

        {/* =====================================================
            RIGHT SIDE - BOOKING REVIEW
        ===================================================== */}

        <aside className="h-fit rounded-2xl border bg-background p-5 shadow-sm lg:sticky lg:top-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Booking Review
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {itemCount} item
                {itemCount !== 1 ? "s" : ""} in cart
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.serviceName}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.variantName}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold">
                    ₹
                    {(
                      item.price *
                      item.quantity
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-5 border-t" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal
              </span>

              <span>
                ₹
                {subtotal.toLocaleString(
                  "en-IN",
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Service fee
              </span>

              <span>Included</span>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-xl font-bold text-primary">
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Current step
            </p>

            <p className="mt-1 text-sm font-semibold">
              {getStepTitle(activeStep)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* =============================================================
   PAYMENT ROW
============================================================= */

function PaymentRow({
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
    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-all text-sm font-semibold">
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition hover:bg-muted"
      >
        <Copy className="h-3.5 w-3.5" />

        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* =============================================================
   STEP INDICATOR
============================================================= */

function StepIndicator({
  number,
  title,
  subtitle,
  icon,
  active,
  completed,
}: {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={[
        "relative rounded-xl border-2 p-4 transition-all duration-300",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : completed
            ? "border-green-500/40 bg-green-50/50"
            : "border-border bg-background",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
            active
              ? "bg-primary text-primary-foreground"
              : completed
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {completed ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="text-sm font-semibold">
              {number}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={
                active
                  ? "text-primary"
                  : completed
                    ? "text-green-600"
                    : "text-muted-foreground"
              }
            >
              {icon}
            </span>

            <p
              className={[
                "text-sm font-semibold",
                active
                  ? "text-foreground"
                  : completed
                    ? "text-green-700"
                    : "text-muted-foreground",
              ].join(" ")}
            >
              {title}
            </p>
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   HELPERS
============================================================= */

function getStepTitle(step: Step) {
  switch (step) {
    case 1:
      return "Enter Service Address";

    case 2:
      return "Choose Date & Time";

    case 3:
      return "Review Booking";

    case 4:
      return "Payment";

    default:
      return "Booking";
  }
}

function formatDate(value: string) {
  if (!value) {
    return "Not selected";
  }

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
