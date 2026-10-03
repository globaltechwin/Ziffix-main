"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    bgClass: string;
    label: string;
  }
> = {
  info: {
    icon: Info,
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-100 dark:bg-blue-950",
    label: "Information",
  },

  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-950",
    label: "Success",
  },

  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-950",
    label: "Important",
  },

  booking: {
    icon: CalendarCheck,
    iconClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-100 dark:bg-violet-950",
    label: "Booking",
  },

  payment: {
    icon: CreditCard,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-950",
    label: "Payment",
  },
};

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/customer/notifications");

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void fetchNotifications();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, []);

  const markAsRead = async (id: string) => {
    setProcessingId(id);

    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setProcessingId(null);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter(
        (notification) => !notification.isRead
      );
    }

    if (activeFilter === "read") {
      return notifications.filter(
        (notification) => notification.isRead
      );
    }

    return notifications;
  }, [notifications, activeFilter]);

  const readCount = notifications.length - unreadCount;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* =====================================================
            TOP HEADER
        ===================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bell className="size-7" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Notifications
                    </h1>

                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Ziffix
                    </span>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                    Stay updated with your bookings, payments, services,
                    and important account activity.
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <CheckCheck className="size-4" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <NotificationStat
                icon={<Bell className="size-4" />}
                label="Total"
                value={notifications.length}
              />

              <NotificationStat
                icon={<Sparkles className="size-4" />}
                label="Unread"
                value={unreadCount}
                highlight={unreadCount > 0}
              />

              <NotificationStat
                icon={<Check className="size-4" />}
                label="Read"
                value={Math.max(0, readCount)}
              />
            </div>
          </div>
        </motion.div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex rounded-xl border bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FilterButton
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
              label="All"
              count={notifications.length}
            />

            <FilterButton
              active={activeFilter === "unread"}
              onClick={() => setActiveFilter("unread")}
              label="Unread"
              count={unreadCount}
            />

            <FilterButton
              active={activeFilter === "read"}
              onClick={() => setActiveFilter("read")}
              label="Read"
              count={Math.max(0, readCount)}
            />
          </div>

          {notifications.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? "s" : ""}
            </p>
          )}
        </motion.div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 rounded-3xl border bg-white p-16 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>

              <p className="mt-4 text-sm font-medium">
                Loading notifications...
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Please wait a moment.
              </p>
            </div>
          </motion.div>
        ) : filteredNotifications.length === 0 ? (

          /* ===================================================
             EMPTY STATE
          =================================================== */

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-3xl border border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-16"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Bell className="size-7 text-slate-400" />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              {activeFilter === "unread"
                ? "You're all caught up"
                : activeFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {activeFilter === "unread"
                ? "You don't have any unread notifications right now."
                : activeFilter === "read"
                  ? "Notifications that you have read will appear here."
                  : "We'll let you know about bookings, payments, services, and important account updates here."}
            </p>

            {activeFilter !== "all" && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                View all notifications
              </button>
            )}
          </motion.div>
        ) : (

          /* ===================================================
             NOTIFICATION LIST
          =================================================== */

          <div className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            {filteredNotifications.map(
              (notification, index) => {
                const config =
                  typeConfig[notification.type] ||
                  typeConfig.info;

                const Icon = config.icon;

                const isProcessing =
                  processingId === notification.id;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.035,
                    }}
                    className={`group relative border-b last:border-b-0 ${
                      notification.isRead
                        ? "bg-white dark:bg-slate-900"
                        : "bg-primary/[0.025] dark:bg-primary/[0.04]"
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
                    )}

                    <div className="flex gap-4 p-5 sm:p-6">

                      {/* Icon */}
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${config.bgClass}`}
                      >
                        <Icon
                          className={`size-5 ${config.iconClass}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">

                            <h2
                              className={`text-sm ${
                                notification.isRead
                                  ? "font-semibold"
                                  : "font-bold"
                              }`}
                            >
                              {notification.title}
                            </h2>

                            {!notification.isRead && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                <span className="size-1.5 rounded-full bg-primary" />
                                NEW
                              </span>
                            )}

                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {config.label}
                            </span>
                          </div>

                          <div className="shrink-0 text-xs text-muted-foreground">
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </div>
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">

                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(
                              notification.createdAt
                            )}
                          </span>

                          {!notification.isRead && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                            >
                              {isProcessing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}

                              Mark as read
                            </button>
                          )}

                          {notification.isRead && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}

        {/* =====================================================
            FOOTER NOTE
        ===================================================== */}

        {!loading && notifications.length > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldIcon />
            Your Ziffix account notifications are shown here.
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================================
   STAT
============================================================= */

function NotificationStat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
      <div
        className={`flex size-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-primary/10 text-primary"
            : "bg-white text-muted-foreground dark:bg-slate-900"
        }`}
      >
        {icon}
      </div>

      <div>
        <p className="text-lg font-bold leading-none">
          {value}
        </p>

        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

/* =============================================================
   FILTER BUTTON
============================================================= */

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}

      <span
        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
          active
            ? "bg-primary-foreground/15"
            : "bg-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* =============================================================
   DATE
============================================================= */

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =============================================================
   TIME
============================================================= */

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =============================================================
   SMALL SHIELD ICON
============================================================= */

function ShieldIcon() {
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
      <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
    </span>
  );
}