"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Award,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EarningsStats {
  totalEarned: number;
  completedValue: number;
  thisMonth: number;
  pendingPayout: number;
  avgPerJob: number;
}

interface MonthlyEarning {
  month: string;
  value: number;
}

interface EarningsRecord {
  id: string;
  jobId: string;
  serviceName: string;
  customerName: string;
  date: string;
  status: "paid" | "pending";
  amount: number;
}

interface EarningsResponse {
  stats: EarningsStats;
  monthly: MonthlyEarning[];
  earnings: EarningsRecord[];
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TechnicianEarningsPage() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadEarnings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/technician/earnings", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load earnings"
        );
      }

      setData({
        stats: {
          totalEarned: Number(result?.stats?.totalEarned || 0),
          completedValue: Number(result?.stats?.completedValue || 0),
          thisMonth: Number(result?.stats?.thisMonth || 0),
          pendingPayout: Number(result?.stats?.pendingPayout || 0),
          avgPerJob: Number(result?.stats?.avgPerJob || 0),
        },
        monthly: Array.isArray(result?.monthly)
          ? result.monthly.map((item: MonthlyEarning) => ({
              month: String(item?.month || ""),
              value: Number(item?.value || 0),
            }))
          : [],
        earnings: Array.isArray(result?.earnings)
          ? result.earnings.map((earning: EarningsRecord) => ({
              id: String(earning?.id || ""),
              jobId: String(earning?.jobId || earning?.id || ""),
              serviceName:
                earning?.serviceName || "Unknown service",
              customerName:
                earning?.customerName || "Customer",
              date: earning?.date || "",
              status:
                earning?.status === "paid"
                  ? "paid"
                  : "pending",
              amount: Number(earning?.amount || 0),
            }))
          : [],
      });
    } catch (err) {
      console.error("Failed to load technician earnings:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load earnings"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const stats = data?.stats ?? {
    totalEarned: 0,
    completedValue: 0,
    thisMonth: 0,
    pendingPayout: 0,
    avgPerJob: 0,
  };

  const monthlyEarnings = data?.monthly ?? [];
  const earnings = data?.earnings ?? [];

  const maxMonthly = useMemo(() => {
    if (monthlyEarnings.length === 0) {
      return 1;
    }

    return Math.max(
      ...monthlyEarnings.map((item) => Number(item.value || 0)),
      1
    );
  }, [monthlyEarnings]);

  const statCards = [
    {
      label: "Total Earned",
      value: formatCurrency(stats.totalEarned),
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "This Month",
      value: formatCurrency(stats.thisMonth),
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending Payout",
      value: formatCurrency(stats.pendingPayout),
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Avg Per Job",
      value: formatCurrency(stats.avgPerJob),
      icon: Award,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading earnings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =======================================================
          HEADER
      ======================================================= */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Earnings
          </h1>

          <p className="text-muted-foreground">
            Track your earnings and payments
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadEarnings(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* =======================================================
          ERROR
      ======================================================= */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadEarnings(true)}
              className="font-medium underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          STAT CARDS
      ======================================================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.label}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {card.label}
                </p>

                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* =======================================================
          PAYMENT SUMMARY
      ======================================================= */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Completed Job Value
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Total value of all completed jobs assigned to you
            </p>
          </div>

          <p className="text-xl font-bold text-foreground">
            {formatCurrency(stats.completedValue)}
          </p>
        </div>
      </div>

      {/* =======================================================
          MONTHLY EARNINGS
      ======================================================= */}
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.2,
        }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 font-semibold text-foreground">
          Monthly Earnings
        </h3>

        {monthlyEarnings.length === 0 ? (
          <div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
            No completed earnings yet.
          </div>
        ) : (
          <div
            className="flex items-end gap-3 overflow-x-auto"
            style={{ height: 160 }}
          >
            {monthlyEarnings.map((item) => {
              const value = Number(item.value || 0);

              const height =
                value > 0
                  ? Math.max(
                      (value / maxMonthly) * 110,
                      8
                    )
                  : 4;

              return (
                <div
                  key={item.month}
                  className="flex min-w-[55px] flex-1 flex-col items-center justify-end"
                >
                  <span className="mb-1 whitespace-nowrap text-[10px] text-muted-foreground">
                    {formatCurrency(value)}
                  </span>

                  <div
                    className="w-full rounded-t-md bg-green-500/80 transition-all"
                    style={{
                      height: `${height}px`,
                    }}
                  />

                  <span className="mt-1 whitespace-nowrap text-[10px] text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* =======================================================
          EARNINGS HISTORY
      ======================================================= */}
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.3,
        }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <h3 className="font-semibold text-foreground">
              Earnings History
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Completed jobs and their payment status
            </p>
          </div>

          <span className="text-sm text-muted-foreground">
            {earnings.length}{" "}
            {earnings.length === 1 ? "job" : "jobs"}
          </span>
        </div>

        {earnings.length === 0 ? (
          <div className="border-t border-border px-4 py-10 text-center">
            <p className="font-medium text-foreground">
              No earnings yet
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Completed technician jobs will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {earnings.map((earning, index) => (
                  <motion.tr
                    key={earning.id}
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: index * 0.03,
                    }}
                  >
                    <TableCell className="max-w-[220px]">
                      <span
                        className="block truncate font-medium"
                        title={earning.jobId}
                      >
                        {earning.jobId}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">
                        {earning.serviceName}
                      </span>
                    </TableCell>

                    <TableCell>
                      {earning.customerName}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDate(earning.date)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={earning.status} />
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatCurrency(earning.amount)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
