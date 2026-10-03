"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users, CalendarCheck, IndianRupee, Wrench, ArrowUpRight, Clock, UserPlus, Star } from "lucide-react";

interface DashboardData {
  totalCustomers: number;
  totalTechnicians: number;
  activeBookings: number;
  completedThisMonth: number;
  totalRevenue: number;
  pendingPayments: number;
  avgRating: number;
  newCustomersThisMonth: number;
  recentActivity: Array<{ id: string; type: string; message: string; userName: string; timestamp: string }>;
  monthlyRevenue: Array<{ month: string; value: number }>;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  booking: CalendarCheck,
  payment: IndianRupee,
  signup: UserPlus,
  review: Star,
};

const activityColors: Record<string, string> = {
  booking: "bg-blue-50 text-blue-600",
  payment: "bg-green-50 text-green-600",
  signup: "bg-purple-50 text-purple-600",
  review: "bg-amber-50 text-amber-600",
};

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="size-9 rounded-lg bg-muted" />
            </div>
            <div className="mt-2 h-8 w-20 rounded bg-muted" />
            <div className="mt-1 h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="animate-pulse self-start rounded-xl border border-border bg-card p-4">
          <div className="mb-4 h-5 w-36 rounded bg-muted" />
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end">
                <div className="h-3 w-8 rounded bg-muted" />
                <div className="mt-1 w-full rounded-t-md bg-muted" style={{ height: `${40 + (i * 17 % 60)}px` }} />
                <div className="mt-1 h-3 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="mb-4 h-5 w-32 rounded bg-muted" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-3 flex items-start gap-3">
              <div className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <Skeleton />;

  const maxRevenue = Math.max(...(data.monthlyRevenue ?? []).map((m) => m.value), 1);

  const statCards = [
    { label: "Total Customers", value: data.totalCustomers ?? 0, icon: Users, color: "text-blue-600 bg-blue-50", change: `+${data.newCustomersThisMonth ?? 0} this month` },
    { label: "Available Bookings", value: data.activeBookings ?? 0, icon: CalendarCheck, color: "text-green-600 bg-green-50", change: `${data.completedThisMonth ?? 0} completed` },
    { label: "Total Revenue", value: `₹${(data.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-purple-600 bg-purple-50", change: `${data.pendingPayments ?? 0} pending` },
    { label: "Available Technicians", value: data.totalTechnicians ?? 0, icon: Wrench, color: "text-amber-600 bg-amber-50", change: `Avg rating ${data.avgRating ?? 0}` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className={`flex size-9 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="self-start rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-4 font-semibold text-foreground">Monthly Revenue</h3>
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {(data.monthlyRevenue ?? []).map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[10px] text-muted-foreground">₹{(m.value / 1000).toFixed(0)}k</span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{ height: `${(m.value / maxRevenue) * 120}px` }}
                />
                <span className="mt-1 text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data.recentActivity ?? []).slice(0, 8).map((activity) => {
              const Icon = activityIcons[activity.type] || CalendarCheck;
              const color = activityColors[activity.type] || "bg-gray-50 text-gray-600";
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${color}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.userName} &middot; {activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 font-semibold text-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/customers" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <Users className="size-4" />
            Manage Customers
            <ArrowUpRight className="size-3 text-muted-foreground" />
          </a>
          <a href="/admin/bookings" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <CalendarCheck className="size-4" />
            Manage Bookings
            <ArrowUpRight className="size-3 text-muted-foreground" />
          </a>
          <a href="/admin/technicians" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <Wrench className="size-4" />
            Manage Technicians
            <ArrowUpRight className="size-3 text-muted-foreground" />
          </a>
          <a href="/admin/services" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Manage Services
            <ArrowUpRight className="size-3 text-muted-foreground" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
