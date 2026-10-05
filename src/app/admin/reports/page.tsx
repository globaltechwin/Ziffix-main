"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  IndianRupee,
  CalendarCheck,
  Users,
  Star,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RevenuePoint = {
  month: string;
  value: number;
};

type TopService = {
  name: string;
  bookings: number;
  revenue: number;
};

type TopTechnician = {
  name: string;
  jobs: number;
  earnings: number;
  rating: number;
};

type ReportsData = {
  stats: {
    totalRevenue: number;
    totalBookings: number;
    newCustomers: number;
    avgRating: number;
  };
  monthlyRevenue: RevenuePoint[];
  topServices: TopService[];
  topTechnicians: TopTechnician[];
  generatedAt?: string;
};

const emptyData: ReportsData = {
  stats: {
    totalRevenue: 0,
    totalBookings: 0,
    newCustomers: 0,
    avgRating: 0,
  },
  monthlyRevenue: [],
  topServices: [],
  topTechnicians: [],
};

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/admin/reports", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load reports");
      }

      setData({
        stats: {
          totalRevenue: Number(payload?.stats?.totalRevenue || 0),
          totalBookings: Number(payload?.stats?.totalBookings || 0),
          newCustomers: Number(payload?.stats?.newCustomers || 0),
          avgRating: Number(payload?.stats?.avgRating || 0),
        },
        monthlyRevenue: Array.isArray(payload?.monthlyRevenue)
          ? payload.monthlyRevenue.map((item: RevenuePoint) => ({
              month: String(item.month),
              value: Number(item.value || 0),
            }))
          : [],
        topServices: Array.isArray(payload?.topServices)
          ? payload.topServices.map((item: TopService) => ({
              name: String(item.name || "Service"),
              bookings: Number(item.bookings || 0),
              revenue: Number(item.revenue || 0),
            }))
          : [],
        topTechnicians: Array.isArray(payload?.topTechnicians)
          ? payload.topTechnicians.map((item: TopTechnician) => ({
              name: String(item.name || "Technician"),
              jobs: Number(item.jobs || 0),
              earnings: Number(item.earnings || 0),
              rating: Number(item.rating || 0),
            }))
          : [],
        generatedAt: payload?.generatedAt,
      });
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load reports",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();

    const interval = window.setInterval(() => {
      void loadReports();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadReports]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...data.monthlyRevenue.map((item) => item.value)),
    [data.monthlyRevenue],
  );

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(data.stats.totalRevenue),
      icon: IndianRupee,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Total Bookings",
      value: data.stats.totalBookings.toLocaleString("en-IN"),
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "New Customers",
      value: data.stats.newCustomers.toLocaleString("en-IN"),
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Avg Rating",
      value: data.stats.avgRating.toFixed(1),
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Reports"
          description="View live analytics from your Ziffix database"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadReports(true)}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className={`flex size-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {loading ? "—" : stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Revenue Trend</h3>
        </div>

        {data.monthlyRevenue.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No completed booking revenue yet.
          </div>
        ) : (
          <div className="flex items-end gap-3" style={{ height: 200 }}>
            {data.monthlyRevenue.map((item) => (
              <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(item.value)}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{ height: `${Math.max(4, (item.value / maxRevenue) * 160)}px` }}
                  title={`${item.month}: ${formatCurrency(item.value)}`}
                />
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-4 font-semibold text-foreground">Top Services</h3>
          <div className="space-y-3">
            {data.topServices.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No completed service bookings yet.</p>
            ) : (
              data.topServices.map((service, i) => (
                <div key={`${service.name}-${i}`} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.bookings} bookings</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(service.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-4 font-semibold text-foreground">Top Technicians</h3>
          <div className="space-y-3">
            {data.topTechnicians.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No completed technician jobs yet.</p>
            ) : (
              data.topTechnicians.map((tech, i) => (
                <div key={`${tech.name}-${i}`} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tech.jobs} jobs &middot; ★ {tech.rating.toFixed(1)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(tech.earnings)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {data.generatedAt && (
        <p className="mt-4 text-right text-xs text-muted-foreground">
          Last updated: {new Date(data.generatedAt).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}
