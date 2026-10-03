"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  User,
  XCircle,
} from "lucide-react";

interface BookingItem {
  id: string;
  serviceName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  duration?: number | null;
  servicevariant?: {
    name: string;
    price: number;
    duration?: number | null;
  } | null;
}

interface BookingDetails {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes?: string | null;
  totalAmount: number;
  service: {
    id: string;
    name: string;
    slug?: string | null;
    category: string;
    image?: string | null;
    duration: number;
  };
  user_booking_technicianIdTouser?: {
    name: string | null;
    phone: string;
    email?: string | null;
  } | null;
  payment?: {
    amount: number;
    status: string;
    method: string;
    transactionId: string;
    createdAt: string;
  } | null;
  bookingitem: BookingItem[];
}

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-purple-200 bg-purple-50 text-purple-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function CustomerBookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/customer/bookings/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Booking not found");
        }

        if (mounted) {
          setBooking(data.booking ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load booking"
          );
          setBooking(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const bookingNumber = useMemo(
    () => id.slice(-8).toUpperCase(),
    [id]
  );

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-5xl items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <XCircle className="mx-auto size-10 text-red-500" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Booking details unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "We could not find this booking."}
          </p>

          <Link
            href="/customer/bookings"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="size-4" />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    statusLabels[booking.status] || booking.status;

  const statusClass =
    statusStyles[booking.status] || statusStyles.pending;

  const paymentStatus =
    booking.payment?.status?.toLowerCase() || "pending";

  const paid = [
    "paid",
    "completed",
    "success",
  ].includes(paymentStatus);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/customer/bookings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="size-4" />
        Back to My Bookings
      </Link>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-64 overflow-hidden bg-slate-100 sm:h-80">
          {booking.service.image ? (
            <img
              src={booking.service.image}
              alt={booking.service.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-slate-100" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>

              <span className="text-xs font-medium text-white/80">
                Booking #{bookingNumber}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {booking.service.name}
            </h1>

            <p className="mt-1 text-sm text-white/80">
              {booking.service.category}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={<Calendar className="size-4" />}
                label="Service date"
                value={formatDate(booking.scheduledDate)}
              />

              <InfoCard
                icon={<Clock className="size-4" />}
                label="Time slot"
                value={booking.scheduledTime}
              />

              <InfoCard
                icon={<MapPin className="size-4" />}
                label="Service address"
                value={booking.address || "Not available"}
              />

              <InfoCard
                icon={<CreditCard className="size-4" />}
                label="Payment"
                value={
                  paid
                    ? "Paid"
                    : "Payment pending"
                }
              />
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-900">
                Services in this booking
              </h2>

              <div className="mt-4 space-y-3">
                {booking.bookingitem.length > 0 ? (
                  booking.bookingitem.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.serviceName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.variantName} × {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        ₹
                        {(
                          item.unitPrice *
                          item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Service item details are not available.
                  </p>
                )}
              </div>
            </section>

            {booking.notes && (
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-base font-bold text-slate-900">
                  Your note
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {booking.notes}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total amount
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                ₹
                {Number(
                  booking.totalAmount || 0
                ).toLocaleString("en-IN")}
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm">
                {paid ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <CreditCard className="size-4 text-amber-600" />
                )}

                <span
                  className={
                    paid
                      ? "font-semibold text-green-700"
                      : "font-semibold text-amber-700"
                  }
                >
                  {paid
                    ? "Payment completed"
                    : "Payment pending"}
                </span>
              </div>

              {booking.payment?.method && (
                <p className="mt-2 text-xs text-slate-500">
                  Method: {booking.payment.method}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-900">
                Technician
              </h2>

              {booking.user_booking_technicianIdTouser ? (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <User className="size-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {booking
                          .user_booking_technicianIdTouser
                          .name ||
                          "Assigned technician"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Technician
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${booking.user_booking_technicianIdTouser.phone}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="size-4" />

                    {
                      booking
                        .user_booking_technicianIdTouser
                        .phone
                    }
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Technician has not been assigned yet.
                </p>
              )}
            </section>

            <Link
              href={`/customer/services/${encodeURIComponent(
                booking.service.slug ||
                  booking.service.id
              )}`}
              className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              View service

              <ChevronRight className="size-4" />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}