"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ArrowRight,
  ChevronRight,
  CreditCard,
} from "lucide-react";

interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  totalAmount: number;
  notes?: string;

  service: {
    name: string;
    slug: string;
    category: string;
    image?: string;
  };

  technician?: {
    name: string;
    phone: string;
  };

  payment?: {
    amount: number;
    status: string;
    method: string;
  } | null;
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    color: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Circle,
  },

  confirmed: {
    label: "Confirmed",
    color: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  },

  in_progress: {
    label: "In Progress",
    color: "border-purple-200 bg-purple-50 text-purple-700",
    icon: Loader2,
  },

  completed: {
    label: "Completed",
    color: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },

  cancelled: {
    label: "Cancelled",
    color: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
};

const tabs = [
  "All",
  "Upcoming",
  "Completed",
  "Cancelled",
] as const;

type Tab = (typeof tabs)[number];

export default function CustomerBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBookings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/customer/bookings", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Failed to load bookings"
          );
        }

        if (mounted) {
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error("Failed to load customer bookings:", err);

        if (mounted) {
          setBookings([]);

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load bookings"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "All") {
      return true;
    }

    if (activeTab === "Upcoming") {
      return (
        booking.status === "pending" ||
        booking.status === "confirmed" ||
        booking.status === "in_progress"
      );
    }

    if (activeTab === "Completed") {
      return booking.status === "completed";
    }

    if (activeTab === "Cancelled") {
      return booking.status === "cancelled";
    }

    return true;
  });

  return (
    <main className="mx-auto w-full max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          My Bookings
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          View and track all your service bookings.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading your bookings...
            </p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Calendar className="h-7 w-7 text-slate-500" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No bookings found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            You don&apos;t have any bookings in this category yet.
          </p>

          <Link
            href="/customer/services"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Browse Services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Booking List */
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const status =
              statusConfig[booking.status] ||
              statusConfig.pending;

            const StatusIcon = status.icon;

            const bookingNumber = booking.id
              .slice(-8)
              .toUpperCase();

            /*
             * PAYMENT STATUS
             *
             * If there is no payment record yet, we still display
             * Payment Pending for a newly-created pending booking.
             */
            const paymentStatus =
              booking.payment?.status?.toLowerCase() || "pending";

            const paymentPending =
              paymentStatus === "pending" ||
              paymentStatus === "created" ||
              paymentStatus === "unpaid";

            const paymentCompleted =
              paymentStatus === "paid" ||
              paymentStatus === "completed" ||
              paymentStatus === "success";

            const paymentFailed =
              paymentStatus === "failed" ||
              paymentStatus === "cancelled";

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Main Booking */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Service Image */}
                    <div className="h-[90px] w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-[125px]">
                      {booking.service?.image ? (
                        <img
                          src={booking.service.image}
                          alt={booking.service.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Calendar className="h-7 w-7 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Service Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {booking.service?.name ||
                            "Home Service"}
                        </h2>

                        {/* Booking Status */}
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            status.color,
                          ].join(" ")}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {booking.service?.category ||
                          "Service"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Booking #{bookingNumber}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          {formatDate(
                            booking.scheduledDate
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          {booking.scheduledTime}
                        </span>
                      </div>
                    </div>

                    {/* Amount + Payment + Details */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:pt-0 lg:min-w-[245px] lg:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-slate-400">
                          Total Amount
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          ₹
                          {Number(
                            booking.totalAmount || 0
                          ).toLocaleString("en-IN")}
                        </p>

                        {/* PAYMENT PENDING */}
                        {paymentPending && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <CreditCard className="h-3 w-3" />
                            Payment Pending
                          </span>
                        )}

                        {/* PAYMENT COMPLETED */}
                        {paymentCompleted && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Payment Paid
                          </span>
                        )}

                        {/* PAYMENT FAILED */}
                        {paymentFailed && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            <XCircle className="h-3 w-3" />
                            Payment Failed
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/customer/bookings/${booking.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Date */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Service Date
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-700">
                          {formatDate(
                            booking.scheduledDate
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Service Address
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-700">
                          {booking.address ||
                            "Address not available"}
                        </p>
                      </div>
                    </div>

                    {/* Technician */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Technician
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-700">
                          {booking.technician?.name ||
                            "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400" />

                      <span className="text-xs text-slate-500">
                        Payment Status
                      </span>

                      {paymentPending && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}

                      {paymentCompleted && (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                          Paid
                        </span>
                      )}

                      {paymentFailed && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700">
                          Failed
                        </span>
                      )}
                    </div>

                    {booking.payment?.method && (
                      <p className="text-xs text-slate-500">
                        Method:{" "}
                        <span className="font-medium text-slate-700">
                          {booking.payment.method}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        Note:
                      </span>{" "}
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
