"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Phone,
  CalendarDays,
  CreditCard,
  UserRound,
  Loader2,
  Users,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

interface AdminCustomer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;

  bookings: number;

  _count: {
    bookings: number;
  };

  subscription: {
    plan: string;
    status: string;
    amount: number;
  } | null;
}
/* =========================================================
   HELPERS
========================================================= */

function getCustomerName(customer: AdminCustomer) {
  return customer.name?.trim() || customer.phone || "Unknown customer";
}

function formatMemberSince(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminCustomersPage() {
  const [data, setData] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [viewCustomer, setViewCustomer] =
    useState<AdminCustomer | null>(null);

  const [editCustomer, setEditCustomer] =
    useState<AdminCustomer | null>(null);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

  const fetchCustomers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const res = await fetch("/api/admin/customers", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        let json: {
          customers?: AdminCustomer[];
          error?: string;
        } = {};

        try {
          json = await res.json();
        } catch {
          json = {};
        }

        if (!res.ok) {
          throw new Error(
            json.error || "Failed to load customers",
          );
        }

        setData(
          Array.isArray(json.customers)
            ? json.customers
            : [],
        );
      } catch (error) {
        console.error("Failed to load customers:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load customers",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return data;
    }

    return data.filter((customer) => {
      const name =
        customer.name?.toLowerCase() || "";

      const phone =
        customer.phone?.toLowerCase() || "";

      const email =
        customer.email?.toLowerCase() || "";

      const plan =
        customer.subscription?.plan?.toLowerCase() ||
        "";

      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        plan.includes(q)
      );
    });
  }, [data, search]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalBookings = useMemo(() => {
  return data.reduce(
    (total, customer) => total + (customer._count?.bookings ?? 0),
    0,
  );
}, [data]);

  /* =========================================================
     DELETE CUSTOMER
  ========================================================= */

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: deleteId,
        }),
      });

      let json: { error?: string } = {};

      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        throw new Error(
          json.error || "Delete failed",
        );
      }

      setDeleteId(null);

      toast.success(
        "Customer deleted successfully",
      );

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Failed to delete customer:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete customer",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     ADD CUSTOMER
  ========================================================= */

  const handleAdd = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    try {
      setSavingAdd(true);

      const fd = new FormData(e.currentTarget);

      const res = await fetch(
        "/api/admin/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            phone: fd.get("phone"),
            password: fd.get("password"),
            name: fd.get("name"),
          }),
        },
      );

      let json: {
        customer?: AdminCustomer;
        error?: string;
      } = {};

      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        throw new Error(
          json.error || "Failed to add customer",
        );
      }

      setAddOpen(false);

      e.currentTarget.reset();

      toast.success(
        "Customer added successfully",
      );

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Failed to add customer:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add customer",
      );
    } finally {
      setSavingAdd(false);
    }
  };

  /* =========================================================
     EDIT CUSTOMER
  ========================================================= */

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!editCustomer) return;

    try {
      setSavingEdit(true);

      const fd = new FormData(e.currentTarget);

      const res = await fetch(
        "/api/admin/customers",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: editCustomer.id,
            name: fd.get("name"),
            phone: fd.get("phone"),
          }),
        },
      );

      let json: {
        customer?: AdminCustomer;
        error?: string;
      } = {};

      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        throw new Error(
          json.error || "Failed to update customer",
        );
      }

      setEditCustomer(null);

      toast.success(
        "Customer updated successfully",
      );

      await fetchCustomers();
    } catch (error) {
      console.error(
        "Failed to update customer:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update customer",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /* =========================================================
     CUSTOMER ACTION MENU
  ========================================================= */

  function CustomerActions({
    customer,
  }: {
    customer: AdminCustomer;
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
              type="button"
              aria-label={`Actions for ${getCustomerName(customer)}`}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44"
        >
          <DropdownMenuItem
            onClick={() =>
              setViewCustomer(customer)
            }
          >
            <Eye className="mr-2 size-4" />
            View Details
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              setEditCustomer(customer)
            }
          >
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              setDeleteId(customer.id)
            }
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /* =========================================================
     LOADING CARD
  ========================================================= */

  function LoadingCard() {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     CUSTOMER CARD
  ========================================================= */

  function CustomerCard({
    customer,
    index,
  }: {
    customer: AdminCustomer;
    index: number;
  }) {
    return (
      <motion.article
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: index * 0.03,
        }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Top */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserRound className="size-5" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {getCustomerName(customer)}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="size-3.5 shrink-0" />
                <span className="truncate">
                  {customer.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>

          <CustomerActions customer={customer} />
        </div>

        {/* Information */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Bookings
            </p>

            <p className="mt-1 text-base font-semibold text-slate-900">
              {customer._count?.bookings ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Plan
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {customer.subscription?.plan || "—"}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <StatusBadge status={customer.role} />

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays className="size-3.5" />
            <span>
              {formatMemberSince(customer.createdAt)}
            </span>
          </div>
        </div>
      </motion.article>
    );
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  function EmptyState() {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Users className="size-5" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-900">
          No customers found
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {search
            ? "Try changing your search to find another customer."
            : "There are no customer accounts in the database yet."}
        </p>

        {search && (
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => setSearch("")}
          >
            Clear Search
          </Button>
        )}
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <PageHeader
          title="Customers"
          description="Manage your customer database"
          actionLabel="Add Customer"
          onAction={() => setAddOpen(true)}
        />

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Customers
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {data.length}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Bookings
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {totalBookings}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CalendarDays className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  With Subscription
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {
                    data.filter(
                      (customer) =>
                        !!customer.subscription,
                    ).length
                  }
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CreditCard className="size-5" />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SEARCH + REFRESH
        ===================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <SearchFilter
              value={search}
              onChange={setSearch}
              placeholder="Search by name or phone..."
            />
          </div>

          <button
            type="button"
            onClick={() => void fetchCustomers(true)}
            disabled={refreshing}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={[
                "size-4",
                refreshing
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {data.length}
            </span>{" "}
            customers
          </p>
        </div>

        {/* =====================================================
            MOBILE CARDS
        ===================================================== */}

        <div className="space-y-3 md:hidden">
          {loading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                index={index}
              />
            ))
          )}
        </div>

        {/* =====================================================
            DESKTOP TABLE
        ===================================================== */}

        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </TableHead>

                  <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bookings
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Plan
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Member Since
                  </TableHead>

                  <TableHead className="w-14 px-4 py-3" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map(
                    (_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={7}>
                          <div className="h-12 animate-pulse rounded bg-slate-100" />
                        </TableCell>
                      </TableRow>
                    ),
                  )
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="p-0"
                    >
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(
                    (customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          delay:
                            index * 0.02,
                        }}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <UserRound className="size-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {getCustomerName(
                                  customer,
                                )}
                              </p>

                              {customer.email && (
                                <p className="max-w-[220px] truncate text-xs text-slate-500">
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4 text-sm text-slate-600">
                          {customer.phone}
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <StatusBadge
                            status={
                              customer.role
                            }
                          />
                        </TableCell>

                        <TableCell className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                          {customer._count
                            ?.bookings ?? 0}
                        </TableCell>

                        <TableCell className="px-4 py-4 text-sm text-slate-600">
                          {customer
                            .subscription
                            ?.plan ?? "—"}
                        </TableCell>

                        <TableCell className="px-4 py-4 text-sm text-slate-500">
                          {formatMemberSince(
                            customer.createdAt,
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-4 text-right">
                          <CustomerActions
                            customer={
                              customer
                            }
                          />
                        </TableCell>
                      </motion.tr>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* =======================================================
          VIEW CUSTOMER
      ======================================================= */}

      <Dialog
        open={!!viewCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setViewCustomer(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Customer Details
            </DialogTitle>
          </DialogHeader>

          {viewCustomer && (
            <div className="space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <UserRound className="size-6" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {getCustomerName(
                      viewCustomer,
                    )}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {viewCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {viewCustomer.phone}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">
                    Role
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={
                        viewCustomer.role
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">
                    Bookings
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {viewCustomer._count
                      ?.bookings ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">
                    Subscription
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {viewCustomer
                      .subscription
                      ?.plan ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border p-3 sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Member Since
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatMemberSince(
                      viewCustomer.createdAt,
                    )}
                  </p>
                </div>
              </div>

              {viewCustomer.email && (
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {viewCustomer.email}
                  </p>
                </div>
              )}

              {viewCustomer.subscription && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-blue-600" />

                    <p className="text-sm font-semibold text-slate-900">
                      Subscription
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Plan
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {
                          viewCustomer
                            .subscription
                            .plan
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-medium capitalize">
                        {
                          viewCustomer
                            .subscription
                            .status
                        }
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">
                        Amount
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(
                          viewCustomer
                            .subscription
                            .amount,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          ADD CUSTOMER
      ======================================================= */}

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Add Customer
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleAdd}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">
                Name
              </Label>

              <Input
                id="customer-name"
                name="name"
                placeholder="Customer name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">
                Phone
              </Label>

              <Input
                id="customer-phone"
                name="phone"
                placeholder="10-digit phone number"
                inputMode="numeric"
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-password">
                Password
              </Label>

              <Input
                id="customer-password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={savingAdd}
            >
              {savingAdd && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {savingAdd
                ? "Adding Customer..."
                : "Add Customer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* =======================================================
          EDIT CUSTOMER
      ======================================================= */}

      <Dialog
        open={!!editCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setEditCustomer(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Customer
            </DialogTitle>
          </DialogHeader>

          {editCustomer && (
            <form
              onSubmit={handleEdit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="edit-customer-name">
                  Name
                </Label>

                <Input
                  id="edit-customer-name"
                  name="name"
                  defaultValue={
  editCustomer.name ?? ""
}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-customer-phone">
                  Phone
                </Label>

                <Input
                  id="edit-customer-phone"
                  name="phone"
                  defaultValue={
                    editCustomer.phone
                  }
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={savingEdit}
              >
                {savingEdit && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}

                {savingEdit
                  ? "Saving Changes..."
                  : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          DELETE CONFIRMATION
      ======================================================= */}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteId(null);
          }
        }}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
