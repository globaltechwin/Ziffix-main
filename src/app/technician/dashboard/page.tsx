"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ClipboardCheck,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Phone,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type TechnicianStatus = "available" | "busy" | "offline";

type Technician = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  specialties: string[];
  certifications: string[];
  rating: number;
  totalJobs: number;
  status: TechnicianStatus;
};

type DashboardStats = {
  todayJobs: number;
  completedJobs: number;
  totalEarned: number;
  completedValue: number;
};

type TodayJob = {
  id: string;
  serviceName: string;
  serviceType: string | null;
  customerName: string;
  customerPhone: string;
  scheduledTime: string;
  address: string;
  notes: string | null;
  amount: number;
  status: string;
};

type RecentCompletedJob = {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  amount: number;
  status: string;
};

type DashboardResponse = {
  technician: Technician;
  stats: DashboardStats;
  todayJobs: TodayJob[];
  recentCompleted: RecentCompletedJob[];
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatStatus(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "confirmed":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function TechnicianDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] =
    useState<TechnicianStatus | null>(null);

  const loadDashboard = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/technician/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load dashboard");
      }

      setData(result);
    } catch (error) {
      console.error("Technician dashboard error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load technician dashboard",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateTechnicianStatus = async (status: TechnicianStatus) => {
    if (!data?.technician) return;

    if (data.technician.status === status) return;

    try {
      setUpdatingStatus(status);

      const response = await fetch("/api/technician/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to update status");
      }

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          technician: {
            ...current.technician,
            status: result.status,
          },
        };
      });

      toast.success(
        `Status changed to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      );
    } catch (error) {
      console.error("Technician status update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update technician status",
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">
            Loading your technician dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <ClipboardCheck className="h-6 w-6 text-red-500" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Please refresh the page and try again.
          </p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { technician, stats, todayJobs, recentCompleted } = data;

  const specialties =
    technician.specialties.length > 0
      ? technician.specialties.join(" • ")
      : "No specialties added";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome, {technician.name || "Technician"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {specialties}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </motion.div>

      {/* Technician availability */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Availability Status
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Choose how customers and the system should treat your current
              availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["available", "busy", "offline"] as TechnicianStatus[]).map(
              (status) => {
                const isActive = technician.status === status;
                const isUpdating = updatingStatus === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateTechnicianStatus(status)}
                    disabled={updatingStatus !== null}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition",
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                      updatingStatus !== null
                        ? "cursor-not-allowed opacity-70"
                        : "",
                    ].join(" ")}
                  >
                    {isUpdating && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {!isUpdating && (
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          status === "available"
                            ? "bg-green-500"
                            : status === "busy"
                              ? "bg-yellow-500"
                              : "bg-gray-400",
                        ].join(" ")}
                      />
                    )}

                    {status}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Today&apos;s Jobs
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.todayJobs}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Active jobs scheduled for today
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Completed Jobs
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.completedJobs}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Total completed bookings
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Earned
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalEarned)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            From paid completed bookings
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Rating
              </p>

              <div className="mt-2 flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {Number(technician.rating || 0).toFixed(1)}
                </p>

                <Star className="h-5 w-5 fill-current text-yellow-500" />
              </div>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Your current technician rating
          </p>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Today&apos;s Schedule
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your active jobs for today
                </p>
              </div>

              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {todayJobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No jobs scheduled for today
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Your schedule is currently clear.
                </p>
              </div>
            ) : (
              todayJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.35 + index * 0.05,
                  }}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {job.serviceName}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(
                            job.status,
                          )}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </div>

                      {job.serviceType && (
                        <p className="mt-1 text-sm text-gray-500">
                          {job.serviceType}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span>{job.scheduledTime}</span>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span>{job.address}</span>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span>{job.customerName}</span>
                        </div>

                        {job.customerPhone && (
                          <a
                            href={`tel:${job.customerPhone}`}
                            className="flex items-start gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{job.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      {job.notes && (
                        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                          <span className="font-medium text-gray-700">
                            Notes:
                          </span>{" "}
                          {job.notes}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Amount
                      </p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(job.amount)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Completed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Completed
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your latest completed jobs
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {recentCompleted.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No completed jobs yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Completed jobs will appear here.
                </p>
              </div>
            ) : (
              recentCompleted.map((job) => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {job.serviceName}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {job.customerName}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {job.date}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(job.amount)}
                      </p>

                      <span className="mt-1 inline-block text-xs font-medium text-green-600">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
