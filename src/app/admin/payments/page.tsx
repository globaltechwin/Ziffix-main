"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MoreHorizontal,
  Eye,
  RotateCcw,
  CheckCircle2,
  Loader2,
  CreditCard,
  CalendarDays,
  User,
  Phone,
  Hash,
  MapPin,
  Wrench,
  RefreshCw,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchFilter } from "@/components/admin/shared/SearchFilter";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type PaymentStatus =
  | "pending"
  | "completed"
  | "refunded"
  | "failed";

type ApiPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  createdAt: string;
  bookingId: string;

  customer?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  booking?: {
    id?: string;
    serviceName?: string | null;
    category?: string | null;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    status?: string | null;
    paymentStatus?: string | null;
    totalAmount?: number | null;
    address?: string | null;

    technician?: {
      id?: string;
      name?: string | null;
      phone?: string | null;
    } | null;
  } | null;
};

type ActionType =
  | "verify"
  | "refund"
  | null;

/* =========================================================
   LABELS
========================================================= */

const methodLabels: Record<string, string> = {
  manual: "Manual Payment",
  bank_transfer: "Bank Transfer",
  google_pay: "Google Pay",
  gpay: "Google Pay",
  qr_code: "QR Code",
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  razorpay: "Online Payment",
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
  )}`;
}

function formatDate(value?: string | null) {
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

function normalizeStatus(
  status: string,
): PaymentStatus {
  if (
    status === "completed" ||
    status === "refunded" ||
    status === "failed" ||
    status === "pending"
  ) {
    return status;
  }

  return "pending";
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminPaymentsPage() {
  const [data, setData] = useState<ApiPayment[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [viewPayment, setViewPayment] =
    useState<ApiPayment | null>(null);

  const [actionPayment, setActionPayment] =
    useState<ApiPayment | null>(null);

  const [actionType, setActionType] =
    useState<ActionType>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD PAYMENTS
  ======================================================= */

  async function loadPayments(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        "/api/admin/payments",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Failed to load payments",
        );
      }

      setData(
        Array.isArray(payload?.payments)
          ? payload.payments
          : [],
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load payments";

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  /* =======================================================
     SEARCH / FILTER
  ======================================================= */

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return data.filter((payment) => {
      const customerName =
        payment.customer?.name || "";

      const customerPhone =
        payment.customer?.phone || "";

      const serviceName =
        payment.booking?.serviceName || "";

      const transactionId =
        payment.transactionId || "";

      const matchesSearch =
        !query ||
        payment.id
          .toLowerCase()
          .includes(query) ||
        payment.bookingId
          .toLowerCase()
          .includes(query) ||
        transactionId
          .toLowerCase()
          .includes(query) ||
        customerName
          .toLowerCase()
          .includes(query) ||
        customerPhone
          .toLowerCase()
          .includes(query) ||
        serviceName
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(payment.status) ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [data, search, statusFilter]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalCompleted = data
    .filter(
      (payment) =>
        normalizeStatus(payment.status) ===
        "completed",
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    );

  const totalPending = data
    .filter(
      (payment) =>
        normalizeStatus(payment.status) ===
        "pending",
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    );

  const totalRefunded = data
    .filter(
      (payment) =>
        normalizeStatus(payment.status) ===
        "refunded",
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    );

  /* =======================================================
     PAYMENT ACTION
  ======================================================= */

  async function handlePaymentAction() {
    if (!actionPayment || !actionType) {
      return;
    }

    const paymentId = actionPayment.id;

    try {
      setProcessingId(paymentId);

      const response = await fetch(
        "/api/admin/payments",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            paymentId,
            action: actionType,
          }),
        },
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Failed to update payment",
        );
      }

      toast.success(
        actionType === "verify"
          ? "Payment verified successfully"
          : "Payment refunded successfully",
      );

      setActionPayment(null);
      setActionType(null);

      await loadPayments(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update payment";

      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="w-full max-w-none">
        <PageHeader
          title="Payments"
          description="Track and verify customer payments"
        />

        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>

          <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-14 animate-pulse bg-muted/40" />

            {Array.from({ length: 8 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex h-16 items-center gap-5 border-t px-5"
                >
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full max-w-none">
      <PageHeader
        title="Payments"
        description="Track and verify customer payments"
      />

      <div className="w-full space-y-6">
        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Completed
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(
                totalCompleted,
              )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Verified customer payments
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Pending Verification
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {formatCurrency(
                totalPending,
              )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Payments waiting for admin review
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Refunded
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(
                totalRefunded,
              )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Payments marked as refunded
            </p>
          </div>
        </div>

        {/* =================================================
            SEARCH / FILTER
        ================================================= */}

        <div className="flex w-full flex-col gap-3 lg:flex-row">
          <div className="min-w-0 flex-1">
            <SearchFilter
              value={search}
              onChange={setSearch}
              placeholder="Search payment ID, booking ID, customer, phone, service, transaction..."
            />
          </div>

          <div className="w-full lg:w-52">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value || "all",
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Status
                </SelectItem>

                <SelectItem value="completed">
                  Completed
                </SelectItem>

                <SelectItem value="pending">
                  Pending
                </SelectItem>

                <SelectItem value="refunded">
                  Refunded
                </SelectItem>

                <SelectItem value="failed">
                  Failed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadPayments(true)
            }
            disabled={refreshing}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* =================================================
            PAYMENT TABLE
        ================================================= */}

        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1050px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">
                    Customer
                  </TableHead>

                  <TableHead className="min-w-[250px]">
                    Booking
                  </TableHead>

                  <TableHead className="min-w-[150px]">
                    Method
                  </TableHead>

                  <TableHead className="min-w-[150px]">
                    Status
                  </TableHead>

                  <TableHead className="min-w-[130px]">
                    Date
                  </TableHead>

                  <TableHead className="min-w-[120px] text-right">
                    Amount
                  </TableHead>

                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(
                    (payment, index) => {
                      const status =
                        normalizeStatus(
                          payment.status,
                        );

                      const isProcessing =
                        processingId ===
                        payment.id;

                      return (
                        <motion.tr
                          key={payment.id}
                          initial={{
                            opacity: 0,
                          }}
                          animate={{
                            opacity: 1,
                          }}
                          transition={{
                            delay:
                              index * 0.015,
                          }}
                          className="group border-b transition-colors hover:bg-muted/30"
                        >
                          {/* CUSTOMER */}

                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {payment.customer
                                  ?.name ||
                                  "Unknown customer"}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {payment.customer
                                  ?.phone ||
                                  "No phone"}
                              </p>
                            </div>
                          </TableCell>

                          {/* BOOKING */}

                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {payment.booking
                                  ?.serviceName ||
                                  "Service"}
                              </p>

                              <p className="mt-0.5 max-w-[250px] truncate text-xs text-muted-foreground">
                                {payment.bookingId}
                              </p>
                            </div>
                          </TableCell>

                          {/* METHOD */}

                          <TableCell>
                            <span className="inline-flex items-center gap-2 text-sm">
                              <CreditCard className="size-4 text-muted-foreground" />

                              {methodLabels[
                                payment.method
                              ] ||
                                payment.method ||
                                "Manual Payment"}
                            </span>
                          </TableCell>

                          {/* STATUS */}

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={status}
                              />

                              {status ===
                                "pending" && (
                                <span className="text-xs text-amber-600">
                                  Verify
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* DATE */}

                          <TableCell>
                            <span className="whitespace-nowrap text-sm">
                              {formatDate(
                                payment.createdAt,
                              )}
                            </span>
                          </TableCell>

                          {/* AMOUNT */}

                          <TableCell className="text-right">
                            <span className="font-semibold">
                              {formatCurrency(
                                payment.amount,
                              )}
                            </span>
                          </TableCell>

                          {/* ACTIONS */}

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                disabled={
                                  isProcessing
                                }
                                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="size-4" />
                                )}
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-52"
                              >
                                {/* VIEW */}

                                <DropdownMenuItem
                                  onClick={() =>
                                    setViewPayment(
                                      payment,
                                    )
                                  }
                                >
                                  <Eye className="mr-2 size-4" />

                                  View Details
                                </DropdownMenuItem>

                                {/* VERIFY */}

                                {status ===
                                  "pending" && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setActionPayment(
                                          payment,
                                        );

                                        setActionType(
                                          "verify",
                                        );
                                      }}
                                      className="text-green-700 focus:text-green-700"
                                    >
                                      <CheckCircle2 className="mr-2 size-4" />

                                      Verify Payment
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {/* REFUND */}

                                {status ===
                                  "completed" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setActionPayment(
                                        payment,
                                      );

                                      setActionType(
                                        "refund",
                                      );
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <RotateCcw className="mr-2 size-4" />

                                    Refund Payment
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    },
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* MOBILE INFO */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 lg:hidden">
          <p className="font-semibold">
            Mobile payment table
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            Swipe the payment table horizontally
            to view all columns and actions.
          </p>
        </div>
      </div>

      {/* ===================================================
          PAYMENT DETAILS
      =================================================== */}

      <Dialog
        open={Boolean(viewPayment)}
        onOpenChange={(open) => {
          if (!open) {
            setViewPayment(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {viewPayment && (
            <div className="space-y-5">
              {/* STATUS */}

              <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={normalizeStatus(
                        viewPayment.status,
                      )}
                    />
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground">
                    Amount
                  </p>

                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      viewPayment.amount,
                    )}
                  </p>
                </div>
              </div>

              {/* CUSTOMER */}

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="size-4 text-primary" />

                  <h3 className="font-semibold">
                    Customer
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {viewPayment.customer
                        ?.name ||
                        "Unknown customer"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 flex items-center gap-2 font-medium">
                      <Phone className="size-3.5" />

                      {viewPayment.customer
                        ?.phone ||
                        "No phone"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 break-all font-medium">
                      {viewPayment.customer
                        ?.email ||
                        "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOOKING */}

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />

                  <h3 className="font-semibold">
                    Booking
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Service
                    </p>

                    <p className="mt-1 font-medium">
                      {viewPayment.booking
                        ?.serviceName ||
                        "Service"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Booking ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs">
                      {viewPayment.bookingId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Booking Status
                    </p>

                    <p className="mt-1 font-medium capitalize">
                      {(
                        viewPayment.booking
                          ?.status ||
                        "pending"
                      ).replace(
                        /_/g,
                        " ",
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Payment Status
                    </p>

                    <p className="mt-1 font-medium capitalize">
                      {(
                        viewPayment.booking
                          ?.paymentStatus ||
                        viewPayment.status
                      ).replace(
                        /_/g,
                        " ",
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled Date
                    </p>

                    <p className="mt-1 flex items-center gap-2 font-medium">
                      <CalendarDays className="size-4" />

                      {formatDate(
                        viewPayment.booking
                          ?.scheduledDate,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled Time
                    </p>

                    <p className="mt-1 font-medium">
                      {viewPayment.booking
                        ?.scheduledTime ||
                        "—"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Address
                    </p>

                    <p className="mt-1 flex gap-2 font-medium">
                      <MapPin className="mt-0.5 size-4 shrink-0" />

                      <span>
                        {viewPayment.booking
                          ?.address ||
                          "Address not available"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* TECHNICIAN */}

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="size-4 text-primary" />

                  <h3 className="font-semibold">
                    Technician
                  </h3>
                </div>

                {viewPayment.booking
                  ?.technician ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Name
                      </p>

                      <p className="mt-1 font-medium">
                        {viewPayment.booking
                          .technician.name ||
                          "Technician"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Phone
                      </p>

                      <p className="mt-1">
                        {viewPayment.booking
                          .technician.phone ||
                          "No phone"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No technician assigned yet.
                  </p>
                )}
              </div>

              {/* PAYMENT */}

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />

                  <h3 className="font-semibold">
                    Payment Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Payment ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs">
                      {viewPayment.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Booking ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs">
                      {viewPayment.bookingId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Method
                    </p>

                    <p className="mt-1 font-medium">
                      {methodLabels[
                        viewPayment.method
                      ] ||
                        viewPayment.method ||
                        "Manual Payment"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Transaction / UTR
                    </p>

                    <p className="mt-1 flex gap-2 break-all font-mono text-xs">
                      <Hash className="mt-0.5 size-3.5 shrink-0" />

                      {viewPayment.transactionId ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Payment Date
                    </p>

                    <p className="mt-1 font-medium">
                      {formatDate(
                        viewPayment.createdAt,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Amount
                    </p>

                    <p className="mt-1 font-bold">
                      {formatCurrency(
                        viewPayment.amount,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}

              {normalizeStatus(
                viewPayment.status,
              ) === "pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setActionPayment(
                      viewPayment,
                    );

                    setActionType(
                      "verify",
                    );

                    setViewPayment(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <CheckCircle2 className="size-4" />

                  Verify Payment
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================
          CONFIRM VERIFY / REFUND
      =================================================== */}

      <ConfirmDialog
        open={Boolean(actionPayment)}
        onOpenChange={(open) => {
          if (!open && !processingId) {
            setActionPayment(null);
            setActionType(null);
          }
        }}
        title={
          actionType === "verify"
            ? "Verify Payment"
            : "Refund Payment"
        }
        description={
          actionPayment
            ? actionType === "verify"
              ? `Verify ${formatCurrency(
                  actionPayment.amount,
                )} payment from ${
                  actionPayment.customer
                    ?.name ||
                  "this customer"
                }? The payment will be marked as completed and the booking payment status will become paid.`
              : `Refund ${formatCurrency(
                  actionPayment.amount,
                )} payment from ${
                  actionPayment.customer
                    ?.name ||
                  "this customer"
                }? The payment will be marked as refunded.`
            : ""
        }
        onConfirm={() =>
          void handlePaymentAction()
        }
        confirmLabel={
          processingId
            ? "Processing..."
            : actionType === "verify"
              ? "Verify Payment"
              : "Process Refund"
        }
      />
    </div>
  );
}
