"use client";

import { useEffect, useMemo, useState } from "react";

type Subscription = {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  startDate: string | null;
  endDate: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

function formatDate(value: string | null) {
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

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "rejected":
    case "cancelled":
      return "bg-red-100 text-red-700";

    case "expired":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Subscription | null>(null);

  async function loadSubscriptions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/subscriptions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load subscriptions",
        );
      }

      const subscriptions = Array.isArray(result)
        ? result
        : Array.isArray(result?.subscriptions)
          ? result.subscriptions
          : Array.isArray(result?.data)
            ? result.data
            : [];

      setData(subscriptions);
    } catch (err) {
      console.error("Admin subscriptions load error:", err);

      setData([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscriptions",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function handleAction(
    id: string,
    action: "verify" | "reject",
  ) {
    const message =
      action === "verify"
        ? "Verify this subscription payment?"
        : "Reject this subscription payment?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      setActionLoading(id);
      setError("");

      const response = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Failed to ${action} subscription`,
        );
      }

      await loadSubscriptions();

      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (err) {
      console.error(
        `Subscription ${action} error:`,
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} subscription`,
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((subscription) => {
      const name =
        subscription.user?.name?.toLowerCase() || "";

      const email =
        subscription.user?.email?.toLowerCase() || "";

      const phone =
        subscription.user?.phone?.toLowerCase() || "";

      const plan =
        subscription.plan?.toLowerCase() || "";

      const id =
        subscription.id?.toLowerCase() || "";

      const reference =
        subscription.paymentReference?.toLowerCase() || "";

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        plan.includes(q) ||
        id.includes(q) ||
        reference.includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        subscription.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const total = data.length;

    const pending = data.filter(
      (item) =>
        item.status?.toLowerCase() === "pending",
    ).length;

    const active = data.filter(
      (item) =>
        item.status?.toLowerCase() === "active",
    ).length;

    const rejected = data.filter(
      (item) =>
        item.status?.toLowerCase() === "rejected",
    ).length;

    const pendingAmount = data
      .filter(
        (item) =>
          item.status?.toLowerCase() === "pending",
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

    return {
      total,
      pending,
      active,
      rejected,
      pendingAmount,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Subscriptions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and verify customer subscription payments.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <p className="text-sm text-yellow-700">
              Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-800">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm text-green-700">
              Active
            </p>
            <p className="mt-1 text-2xl font-bold text-green-800">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-700">
              Rejected
            </p>
            <p className="mt-1 text-2xl font-bold text-red-800">
              {stats.rejected}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm text-blue-700">
              Pending Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-800">
              {formatAmount(stats.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, plan, ID or payment reference..."
              className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>

            <button
              type="button"
              onClick={loadSubscriptions}
              disabled={loading}
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading subscriptions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-800">
                No subscriptions found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing the search or status filter.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((subscription) => (
                      <tr
                        key={subscription.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {subscription.user?.name ||
                              "Unknown customer"}
                          </div>

                          <div className="text-xs text-slate-500">
                            {subscription.user?.email ||
                              subscription.user?.phone ||
                              "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium capitalize text-slate-800">
                            {subscription.plan}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatAmount(
                            subscription.amount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm capitalize text-slate-700">
                            {subscription.paymentMethod ||
                              "—"}
                          </div>

                          <div className="max-w-[180px] truncate text-xs text-slate-500">
                            {subscription.paymentReference ||
                              "No reference"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                              subscription.status,
                            )}`}
                          >
                            {subscription.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            subscription.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelected(subscription)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>

                            {subscription.status ===
                              "pending" && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ===
                                    subscription.id
                                  }
                                  onClick={() =>
                                    handleAction(
                                      subscription.id,
                                      "verify",
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  Verify
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ===
                                    subscription.id
                                  }
                                  onClick={() =>
                                    handleAction(
                                      subscription.id,
                                      "reject",
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {filtered.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {subscription.user?.name ||
                            "Unknown customer"}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {subscription.user?.email ||
                            subscription.user?.phone ||
                            "—"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                          subscription.status,
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">
                          Plan
                        </p>
                        <p className="font-semibold capitalize text-slate-800">
                          {subscription.plan}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Amount
                        </p>
                        <p className="font-semibold text-slate-800">
                          {formatAmount(
                            subscription.amount,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Payment method
                        </p>
                        <p className="capitalize text-slate-800">
                          {subscription.paymentMethod ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Reference
                        </p>
                        <p className="truncate text-slate-800">
                          {subscription.paymentReference ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelected(subscription)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        View
                      </button>

                      {subscription.status ===
                        "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              subscription.id
                            }
                            onClick={() =>
                              handleAction(
                                subscription.id,
                                "verify",
                              )
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Verify
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              subscription.id
                            }
                            onClick={() =>
                              handleAction(
                                subscription.id,
                                "reject",
                              )
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Subscription Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selected.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selected.user?.name ||
                    "Unknown customer"}
                </p>

                <p className="text-sm text-slate-600">
                  {selected.user?.email || "—"}
                </p>

                <p className="text-sm text-slate-600">
                  {selected.user?.phone || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Plan
                  </p>
                  <p className="mt-1 font-semibold capitalize">
                    {selected.plan}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Amount
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatAmount(selected.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                      selected.status,
                    )}`}
                  >
                    {selected.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment method
                  </p>
                  <p className="mt-1 capitalize">
                    {selected.paymentMethod ||
                      "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Payment reference / UTR
                </p>

                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm break-all">
                  {selected.paymentReference ||
                    "No payment reference"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    Submitted
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDateTime(
                      selected.createdAt,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Verified
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDateTime(
                      selected.verifiedAt,
                    )}
                  </p>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-3 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    disabled={
                      actionLoading === selected.id
                    }
                    onClick={() =>
                      handleAction(
                        selected.id,
                        "verify",
                      )
                    }
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Verify Payment
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading === selected.id
                    }
                    onClick={() =>
                      handleAction(
                        selected.id,
                        "reject",
                      )
                    }
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
