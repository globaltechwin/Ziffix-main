"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  FileText,
  MapPin,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type InvoiceStatus =
  | "paid"
  | "pending"
  | "failed";

type InvoiceItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  variantId: string | null;
  variantName: string;
  quantity: number;
  unitPrice: number;
  duration: number | null;
  lineTotal: number;
};

type TechnicianProfile = {
  specialties?: string | null;
  rating?: number | null;
  status?: string | null;
  certifications?: string | null;
} | null;

type Invoice = {
  id: string;
  invoiceId: string;

  bookingId: string;

  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  serviceSlug: string | null;
  serviceImage: string | null;

  technicianId: string | null;
  technicianName: string;
  technicianPhone: string | null;
  technicianEmail: string | null;
  technicianProfile: TechnicianProfile;

  scheduledDate: string;
  scheduledTime: string;

  address: string;
  notes: string | null;

  bookingStatus: string;

  paymentStatus: InvoiceStatus;

  amount: number;
  subtotal: number;
  tax: number;
  total: number;

  paymentId: string | null;
  method: string;
  transactionId: string | null;
  paymentAmount: number;

  createdAt: string;
  paymentCreatedAt: string | null;

  items: InvoiceItem[];
};

type InvoiceResponse = {
  invoices?: Invoice[];

  summary?: {
    totalPaid?: number;
    totalPending?: number;
    totalFailed?: number;
    count?: number;
  };

  error?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
  )}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: InvoiceStatus) {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Pending";
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="size-3.5" />
        Paid
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <XCircle className="size-3.5" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock className="size-3.5" />
      Pending
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<
      "All" | "Paid" | "Pending" | "Failed"
    >("All");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadInvoices = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/customer/invoices",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        let payload: InvoiceResponse = {};

        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Failed to load invoices",
          );
        }

        setInvoices(
          Array.isArray(payload.invoices)
            ? payload.invoices
            : [],
        );
      } catch (err) {
        console.error(
          "Failed to load customer invoices:",
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load invoices";

        setError(message);
        setInvoices([]);

        if (showRefresh) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredInvoices = useMemo(() => {
    if (activeTab === "All") {
      return invoices;
    }

    return invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        activeTab.toLowerCase(),
    );
  }, [invoices, activeTab]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    return {
      paid: invoices
        .filter(
          (invoice) =>
            invoice.paymentStatus === "paid",
        )
        .reduce(
          (sum, invoice) =>
            sum + invoice.total,
          0,
        ),

      pending: invoices
        .filter(
          (invoice) =>
            invoice.paymentStatus === "pending",
        )
        .reduce(
          (sum, invoice) =>
            sum + invoice.total,
          0,
        ),

      failed: invoices
        .filter(
          (invoice) =>
            invoice.paymentStatus === "failed",
        )
        .reduce(
          (sum, invoice) =>
            sum + invoice.total,
          0,
        ),
    };
  }, [invoices]);

  /* =======================================================
     DOWNLOAD / PRINT
  ======================================================= */

  const handleDownload = (
    invoice: Invoice,
  ) => {
    /*
     * There is currently no PDF generation endpoint
     * in the supplied project structure.
     *
     * Use the browser print dialog for now.
     */
    setExpandedId(invoice.id);

    window.setTimeout(() => {
      window.print();
    }, 100);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded bg-slate-200" />

          <div className="mt-2 h-4 w-64 rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-slate-200" />
            <div className="h-28 rounded-2xl bg-slate-200" />
            <div className="h-28 rounded-2xl bg-slate-200" />
          </div>

          <div className="mt-6 h-12 rounded-xl bg-slate-200" />

          <div className="mt-5 space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 lg:py-9 print:max-w-none">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Invoices
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your booking invoices and payment
            status.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadInvoices(true)
          }
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={[
              "size-4",
              refreshing
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          Refresh
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">
            Could not load invoices
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadInvoices(true)
            }
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(summary.paid)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Verified payments
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatCurrency(summary.pending)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Awaiting payment verification
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Failed
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(summary.failed)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Failed or cancelled payments
          </p>
        </div>
      </section>

      {/* ===================================================
          FILTER TABS
      =================================================== */}

      <div className="mt-6 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1 print:hidden">
        {(
          [
            "All",
            "Paid",
            "Pending",
            "Failed",
          ] as const
        ).map((tab) => {
          const active =
            activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() =>
                setActiveTab(tab)
              }
              className={[
                "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ===================================================
          EMPTY
      =================================================== */}

      {!error &&
        filteredInvoices.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FileText className="mx-auto size-10 text-slate-300" />

            <h2 className="mt-4 text-base font-bold text-slate-900">
              No invoices found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {invoices.length === 0
                ? "Your booking invoices will appear here."
                : `There are no ${activeTab.toLowerCase()} invoices.`}
            </p>
          </div>
        )}

      {/* ===================================================
          INVOICE LIST
      =================================================== */}

      <div className="mt-5 space-y-4">
        {filteredInvoices.map(
          (invoice) => {
            const expanded =
              expandedId === invoice.id;

            return (
              <article
                key={invoice.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none"
              >
                {/* =========================================
                    SUMMARY ROW
                ========================================= */}

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(
                      expanded
                        ? null
                        : invoice.id,
                    )
                  }
                  className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {invoice.invoiceId}
                      </span>

                      <StatusBadge
                        status={
                          invoice.paymentStatus
                        }
                      />
                    </div>

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {invoice.serviceName}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        {invoice.technicianName}
                      </span>

                      <span>
                        {formatDate(
                          invoice.createdAt,
                        )}
                      </span>

                      <span>
                        Booking #
                        {invoice.bookingId.slice(
                          -8,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(
                        invoice.total,
                      )}
                    </span>

                    {expanded ? (
                      <ChevronUp className="size-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* =========================================
                    DETAILS
                ========================================= */}

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                    {/* -------------------------------------
                        TOP INFORMATION
                    ------------------------------------- */}

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="size-4" />

                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Service date
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {formatDate(
                            invoice.scheduledDate,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.scheduledTime}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <CreditCard className="size-4" />

                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Payment
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {statusLabel(
                            invoice.paymentStatus,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.method ||
                            "Manual"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileText className="size-4" />

                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Booking status
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold capitalize text-slate-900">
                          {invoice.bookingStatus.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* -------------------------------------
                        SERVICE ITEMS
                    ------------------------------------- */}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Service details
                      </h3>

                      <div className="mt-4 divide-y divide-slate-100">
                        {invoice.items.length > 0 ? (
                          invoice.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {
                                      item.serviceName
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {
                                      item.variantName
                                    }

                                    {" × "}

                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                <p className="shrink-0 text-sm font-bold text-slate-900">
                                  {formatCurrency(
                                    item.lineTotal,
                                  )}
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="py-2 text-sm text-slate-500">
                            Service item details are
                            not available.
                          </div>
                        )}
                      </div>

                      {/* -----------------------------------
                          TOTAL
                      ----------------------------------- */}

                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Booking total
                          </span>

                          <span className="font-semibold text-slate-900">
                            {formatCurrency(
                              invoice.subtotal,
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Tax
                          </span>

                          <span className="font-semibold text-slate-700">
                            ₹0
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="font-bold text-slate-900">
                            Total
                          </span>

                          <span className="text-xl font-bold text-blue-700">
                            {formatCurrency(
                              invoice.total,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* -------------------------------------
                        TECHNICIAN
                    ------------------------------------- */}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Technician
                      </h3>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <User className="size-5" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {
                                invoice.technicianName
                              }
                            </p>

                            {invoice
                              .technicianProfile
                              ?.specialties && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {
                                  invoice
                                    .technicianProfile
                                    .specialties
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {invoice.technicianPhone && (
                          <a
                            href={`tel:${invoice.technicianPhone}`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {
                              invoice.technicianPhone
                            }
                          </a>
                        )}
                      </div>
                    </div>

                    {/* -------------------------------------
                        ADDRESS
                    ------------------------------------- */}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Service address
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {invoice.address ||
                              "Address not available"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* -------------------------------------
                        PAYMENT INFORMATION
                    ------------------------------------- */}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Payment information
                      </h3>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-400">
                            Payment status
                          </p>

                          <div className="mt-1">
                            <StatusBadge
                              status={
                                invoice.paymentStatus
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Payment method
                          </p>

                          <p className="mt-1 font-semibold capitalize text-slate-800">
                            {invoice.method ||
                              "Manual"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Transaction ID
                          </p>

                          <p className="mt-1 break-all font-medium text-slate-700">
                            {invoice.transactionId ||
                              "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Payment date
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatDateTime(
                              invoice.paymentCreatedAt,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* -------------------------------------
                        ACTIONS
                    ------------------------------------- */}

                    <div className="mt-4 flex flex-wrap gap-3 print:hidden">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(
                            invoice,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Download className="size-4" />

                        Print / Save Invoice
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          },
        )}
      </div>
    </main>
  );
}
