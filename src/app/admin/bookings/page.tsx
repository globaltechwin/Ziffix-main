"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Technician {
  id: string;
  name: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Service {
  id: string;
  name: string;
  basePrice?: number;
}

interface Booking {
  id: string;
  customerId: string;
  technicianId?: string | null;
  serviceId: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes?: string | null;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;

  // Current API response
  customer?: Customer | null;

  // Backward compatibility
  user_booking_customerIdTouser?: Customer | null;

  user_booking_technicianIdTouser?: Technician | null;
  service?: Service | null;
}

type BookingTab =
  | "All"
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled";

const tabs: BookingTab[] = [
  "All",
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled",
];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusClasses: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-purple-200 bg-purple-50 text-purple-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: string) {
  return (
    statusClasses[status] ||
    "border-slate-200 bg-slate-50 text-slate-700"
  );
}

function statusLabel(status: string) {
  return statusLabels[status] || status;
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getCustomer(booking: Booking): Customer | null {
  return (
    booking.customer ??
    booking.user_booking_customerIdTouser ??
    null
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [activeTab, setActiveTab] = useState<BookingTab>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [technicianOpenId, setTechnicianOpenId] = useState<string | null>(
    null,
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
    null,
  );

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        status: string;
        technicianId: string | null;
      }
    >
  >({});

  function getDraft(booking: Booking) {
    return (
      drafts[booking.id] || {
        status: booking.status,
        technicianId: booking.technicianId || null,
      }
    );
  }

  function setDraft(
    booking: Booking,
    changes: Partial<{
      status: string;
      technicianId: string | null;
    }>,
  ) {
    const current = getDraft(booking);

    setDrafts((existing) => ({
      ...existing,
      [booking.id]: {
        ...current,
        ...changes,
      },
    }));
  }

  function hasDraftChanges(booking: Booking) {
    const draft = drafts[booking.id];
    if (!draft) return false;

    return (
      draft.status !== booking.status ||
      draft.technicianId !== (booking.technicianId || null)
    );
  }

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/bookings", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load bookings");
      }

      setBookings(Array.isArray(payload?.bookings) ? payload.bookings : []);
      setDrafts({});
    } catch (err) {
      console.error("Failed to load admin bookings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load bookings",
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      const response = await fetch("/api/admin/technicians", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load technicians");
      }

      setTechnicians(
        Array.isArray(payload?.technicians) ? payload.technicians : [],
      );
    } catch (err) {
      console.error("Failed to load technicians:", err);
      setTechnicians([]);
    }
  }

  useEffect(() => {
    void loadBookings();
    void loadTechnicians();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (
        activeTab !== "All" &&
        !(
          (activeTab === "Pending" && booking.status === "pending") ||
          (activeTab === "In Progress" && booking.status === "in_progress") ||
          (activeTab === "Completed" && booking.status === "completed") ||
          (activeTab === "Cancelled" && booking.status === "cancelled")
        )
      ) {
        return false;
      }

      if (!query) return true;

      const customer = getCustomer(booking);
      const technician = booking.user_booking_technicianIdTouser;
      const service = booking.service;
       const selectedCustomer = selectedBooking
    ? getCustomer(selectedBooking)
    : null;

      return (
        booking.id.toLowerCase().includes(query) ||
        (customer?.name || "").toLowerCase().includes(query) ||
        (customer?.phone || "").toLowerCase().includes(query) ||
        (technician?.name || "").toLowerCase().includes(query) ||
        (service?.name || "").toLowerCase().includes(query)
      );
    });
  }, [bookings, activeTab, search]);

  async function updateBooking(
    bookingId: string,
    values: {
      status?: string;
      technicianId?: string | null;
    },
  ) {
    try {
      setUpdatingId(bookingId);
      setError("");

      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          ...values,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update booking");
      }

      if (payload?.booking) {
        setBookings((current) =>
          current.map((booking) =>
            booking.id === bookingId ? payload.booking : booking,
          ),
        );

        setSelectedBooking((current) =>
          current?.id === bookingId ? payload.booking : current,
        );
      } else {
        await loadBookings();
      }

      setDrafts((current) => {
        const next = { ...current };
        delete next[bookingId];
        return next;
      });

      setTechnicianOpenId(null);
    } catch (err) {
      console.error("Failed to update booking:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update booking",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveBookingChanges(booking: Booking) {
    const draft = drafts[booking.id];
    if (!draft || !hasDraftChanges(booking)) return;

    /*
     * IMPORTANT:
     * A completed booking cannot be moved back to another status.
     * The status control is locked for completed bookings below.
     * We still allow technician assignment changes on a completed booking.
     */
    const values: {
      status?: string;
      technicianId?: string | null;
    } = {
      technicianId: draft.technicianId,
    };

    if (booking.status !== "completed") {
      values.status = draft.status;
    }

    await updateBooking(booking.id, values);
  }

  function chooseTechnician(booking: Booking, technicianId: string | null) {
    setDraft(booking, { technicianId });
    setTechnicianOpenId(null);
  }

  function openDetails(booking: Booking) {
    setSelectedBooking(booking);
    setTechnicianOpenId(null);
  }

  function goToCreateBooking() {
    window.location.href = "/admin/bookings/create";
  }

  return (
    <main className="w-full max-w-none px-3 py-5 sm:px-5 lg:px-7 xl:px-9">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
              Bookings
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              View and manage all bookings
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Select a technician or change the status, then click Save to
              update the booking.
            </p>
          </div>

          <button
            type="button"
            onClick={goToCreateBooking}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Create Booking
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by booking ID, customer, service, or technician..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:flex sm:overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-1",
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-500 hover:text-red-700"
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading bookings...
              </p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Calendar className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No bookings found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1250px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[11%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Technician
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Save
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.map((booking) => {
                      const customer =
                        booking.user_booking_customerIdTouser;
                      const draft = getDraft(booking);
                      const draftTechnician = technicians.find(
                        (item) => item.id === draft.technicianId,
                      );
                      const isUpdating = updatingId === booking.id;
                      const hasChanges = hasDraftChanges(booking);
                      const completed = booking.status === "completed";

                      return (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-4 align-middle">
                            <button
                              type="button"
                              onClick={() => openDetails(booking)}
                              title={booking.id}
                              className="block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-blue-600"
                            >
                              {booking.id}
                            </button>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <button
                              type="button"
                              onClick={() => openDetails(booking)}
                              className="block max-w-full text-left"
                            >
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {booking.service?.name || "Service"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Home Service
                              </p>
                            </button>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {customer?.name || "Unknown customer"}
                              </p>
                              {customer?.phone && (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {customer.phone}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="relative px-4 py-4 align-middle">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                setTechnicianOpenId(
                                  technicianOpenId === booking.id
                                    ? null
                                    : booking.id,
                                )
                              }
                              className="inline-flex max-w-full items-center gap-1.5 text-sm text-slate-700 hover:text-blue-600 disabled:opacity-50"
                            >
                              <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">
                                {draftTechnician?.name || "Unassigned"}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                            </button>

                            {technicianOpenId === booking.id && (
                              <div className="absolute left-3 top-[68px] z-40 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() =>
                                    chooseTechnician(booking, null)
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  <span>Unassigned</span>
                                  {!draft.technicianId && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </button>

                                {technicians.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      chooseTechnician(booking, item.id)
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                                  >
                                    <span className="truncate">
                                      {item.name || "Technician"}
                                    </span>
                                    {draft.technicianId === item.id && (
                                      <Check className="h-4 w-4 shrink-0 text-blue-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <div className="text-sm font-medium text-slate-700">
                              {formatDate(booking.scheduledDate)}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {booking.scheduledTime}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <select
                              value={draft.status}
                              disabled={isUpdating || completed}
                              onChange={(event) =>
                                setDraft(booking, {
                                  status: event.target.value,
                                })
                              }
                              title={
                                completed
                                  ? "Completed bookings cannot be moved back to another status"
                                  : "Change booking status"
                              }
                              className={[
                                "w-full max-w-[145px] rounded-full border px-3 py-1.5 text-xs font-semibold outline-none",
                                completed
                                  ? "cursor-not-allowed opacity-80"
                                  : "cursor-pointer",
                                statusClass(draft.status),
                              ].join(" ")}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in_progress">
                                In Progress
                              </option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="px-4 py-4 text-right align-middle">
                            <span className="whitespace-nowrap text-sm font-bold text-slate-900">
                              {money(booking.totalAmount)}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              disabled={isUpdating || !hasChanges}
                              onClick={() => void saveBookingChanges(booking)}
                              className="inline-flex min-w-[68px] items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              {isUpdating ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filteredBookings.map((booking) => {
                const customer = booking.user_booking_customerIdTouser;
                const draft = getDraft(booking);
                const draftTechnician = technicians.find(
                  (item) => item.id === draft.technicianId,
                );
                const isUpdating = updatingId === booking.id;
                const hasChanges = hasDraftChanges(booking);
                const completed = booking.status === "completed";

                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openDetails(booking)}
                        className="min-w-0 text-left"
                      >
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {booking.id}
                        </p>
                        <p className="mt-1 truncate text-base font-bold text-slate-900">
                          {booking.service?.name || "Service"}
                        </p>
                      </button>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                          booking.status,
                        )}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Customer</p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {customer?.name || "Unknown customer"}
                        </p>
                        {customer?.phone && (
                          <p className="truncate text-xs text-slate-500">
                            {customer.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Amount</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {money(booking.totalAmount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Date & Time</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {formatDate(booking.scheduledDate)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.scheduledTime}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Technician</p>
                        <div className="relative mt-1">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              setTechnicianOpenId(
                                technicianOpenId === booking.id
                                  ? null
                                  : booking.id,
                              )
                            }
                            className="inline-flex max-w-full items-center gap-1 text-left text-sm font-medium text-slate-700"
                          >
                            <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {draftTechnician?.name || "Unassigned"}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                          </button>

                          {technicianOpenId === booking.id && (
                            <div className="absolute left-0 top-8 z-40 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                              <button
                                type="button"
                                onClick={() =>
                                  chooseTechnician(booking, null)
                                }
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                              >
                                Unassigned
                                {!draft.technicianId && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </button>

                              {technicians.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    chooseTechnician(booking, item.id)
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                                >
                                  <span className="truncate">
                                    {item.name || "Technician"}
                                  </span>
                                  {draft.technicianId === item.id && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <select
                        value={draft.status}
                        disabled={isUpdating || completed}
                        onChange={(event) =>
                          setDraft(booking, {
                            status: event.target.value,
                          })
                        }
                        className={[
                          "h-10 rounded-lg border px-3 text-sm font-medium outline-none",
                          completed
                            ? "cursor-not-allowed opacity-80"
                            : "cursor-pointer",
                          statusClass(draft.status),
                        ].join(" ")}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        disabled={isUpdating || !hasChanges}
                        onClick={() => void saveBookingChanges(booking)}
                        className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </button>
                    </div>

                    {completed && (
                      <p className="mt-2 text-xs text-slate-400">
                        Completed bookings cannot be moved back to another
                        status.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Details modal */}
        {selectedBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedBooking(null);
              }
            }}
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Booking details
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {selectedBooking.service?.name || "Service"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Booking ID</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {selectedBooking.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {money(selectedBooking.totalAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Customer</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBooking.user_booking_customerIdTouser?.name || "Unknown customer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedBooking.user_booking_customerIdTouser?.phone || "No phone"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Technician</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBooking.user_booking_technicianIdTouser?.name || "Unassigned"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedBooking.user_booking_technicianIdTouser?.phone || "No phone"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(selectedBooking.scheduledDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedBooking.scheduledTime}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedBooking.address || "No address provided"}
                  </p>
                </div>

                {selectedBooking.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-400">Notes</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
