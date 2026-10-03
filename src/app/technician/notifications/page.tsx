"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Info,
  Loader2,
  RefreshCw,
  UserCheck,
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

type NotificationConfig = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  iconClass: string;
  bgClass: string;
};

const typeConfig: Record<string, NotificationConfig> = {
  info: {
    icon: Info,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },

  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-100",
  },

  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-600",
    bgClass: "bg-amber-100",
  },

  booking: {
    icon: CalendarCheck,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-100",
  },

  payment: {
    icon: CreditCard,
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-100",
  },

  assignment: {
    icon: UserCheck,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },

  job: {
    icon: CalendarCheck,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-100",
  },
};

function getNotificationConfig(
  type: string,
): NotificationConfig {
  return (
    typeConfig[type] ||
    typeConfig.info
  );
}

function formatNotificationTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diff =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    diff / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

/**
 * Extract the booking ID from notification text.
 *
 * Admin/technician notifications use:
 *
 * Booking: <booking-id>
 *
 * We keep this compatible with the
 * existing notification database structure,
 * which does not require adding a bookingId
 * column to the Prisma schema.
 */
function extractBookingId(
  notification: Notification,
) {
  const combined =
    `${notification.title}\n${notification.message}`;

  /*
   * Supports both:
   *
   * Booking: ABC123
   * Booking ABC123
   * booking ABC123.
   */
  const match = combined.match(
    /\bBooking\s*:?\s*([a-zA-Z0-9_-]+)/i,
  );

  return match?.[1] || null;
}

function isJobNotification(
  notification: Notification,
) {
  const text =
    `${notification.title} ${notification.message}`
      .toLowerCase();

  return (
    notification.type === "booking" ||
    notification.type === "assignment" ||
    notification.type === "job" ||
    text.includes("assigned") ||
    text.includes("booking") ||
    text.includes("job")
  );
}

export default function TechnicianNotificationsPage() {
  const router = useRouter();

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState<string | null>(null);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const fetchNotifications =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await fetch(
              "/api/technician/notifications",
              {
                method: "GET",
                cache: "no-store",
                credentials: "include",
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.error ||
                "Failed to load notifications",
            );
          }

          const items =
            Array.isArray(
              data?.notifications,
            )
              ? data.notifications
              : [];

          setNotifications(items);

          setUnreadCount(
            typeof data?.unreadCount ===
              "number"
              ? data.unreadCount
              : items.filter(
                  (item: Notification) =>
                    !item.isRead,
                ).length,
          );
        } catch (error) {
          console.error(
            "Technician notifications error:",
            error,
          );

          if (!showRefresh) {
            setNotifications([]);
            setUnreadCount(0);
          }

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load notifications",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.isRead,
        ),
      [notifications],
    );

  const readNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            notification.isRead,
        ),
      [notifications],
    );

  const markAsRead = async (
    notificationId: string,
  ) => {
    try {
      setActionLoading(
        notificationId,
      );

      const response =
        await fetch(
          "/api/technician/notifications",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              id: notificationId,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to mark notification as read",
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification,
          ),
      );

      setUnreadCount(
        (current) =>
          Math.max(0, current - 1),
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setActionLoading("all");

      const response =
        await fetch(
          "/api/technician/notifications",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              all: true,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to mark all notifications as read",
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              isRead: true,
            }),
          ),
      );

      setUnreadCount(0);

      toast.success(
        "All notifications marked as read",
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openNotification = async (
    notification: Notification,
  ) => {
    /*
     * Always mark the notification as read
     * before navigating.
     */
    if (!notification.isRead) {
      await markAsRead(
        notification.id,
      );
    }

    const bookingId =
      extractBookingId(notification);

    /*
     * Job/booking notifications go directly
     * to the technician jobs page.
     *
     * The booking query parameter will be
     * connected to the jobs page in the
     * next implementation step.
     */
    if (
      bookingId &&
      isJobNotification(notification)
    ) {
      router.push(
        `/technician/jobs?booking=${encodeURIComponent(
          bookingId,
        )}`,
      );

      return;
    }

    /*
     * Payment notifications currently go
     * to earnings because payment/earnings
     * are connected there.
     */
    if (
      notification.type ===
      "payment"
    ) {
      router.push(
        "/technician/earnings",
      );

      return;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-3">
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
              <Bell className="size-5 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Notifications
              </h1>

              <p className="text-sm text-muted-foreground">
                Stay updated about your jobs,
                assignments and payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void fetchNotifications(
                true,
              )
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              void markAllAsRead()
            }
            disabled={
              unreadCount === 0 ||
              actionLoading === "all"
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading === "all" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}

            Mark all read
          </button>
        </div>
      </div>

      {/* Summary */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold">
            {notifications.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            All notifications
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Unread
          </p>

          <p className="mt-1 text-2xl font-bold text-primary">
            {unreadCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Require your attention
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Read
          </p>

          <p className="mt-1 text-2xl font-bold">
            {readNotifications.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Previously viewed
          </p>
        </div>
      </div>

      {/* Empty state */}

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Bell className="size-7 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            No notifications yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            When an admin assigns you a job,
            changes a booking, or verifies a
            payment, the update will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread */}

          {unreadNotifications.length >
            0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    New
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Notifications requiring your
                    attention
                  </p>
                </div>

                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {unreadNotifications.length}
                </span>
              </div>

              <div className="space-y-3">
                {unreadNotifications.map(
                  (
                    notification,
                    index,
                  ) => (
                    <NotificationCard
                      key={
                        notification.id
                      }
                      notification={
                        notification
                      }
                      index={index}
                      loading={
                        actionLoading ===
                        notification.id
                      }
                      onOpen={
                        openNotification
                      }
                      onMarkRead={
                        markAsRead
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )}

          {/* Read */}

          {readNotifications.length >
            0 && (
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold">
                  Earlier
                </h2>

                <p className="text-xs text-muted-foreground">
                  Previously viewed notifications
                </p>
              </div>

              <div className="space-y-3">
                {readNotifications.map(
                  (
                    notification,
                    index,
                  ) => (
                    <NotificationCard
                      key={
                        notification.id
                      }
                      notification={
                        notification
                      }
                      index={index}
                      loading={false}
                      onOpen={
                        openNotification
                      }
                      onMarkRead={
                        markAsRead
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  index,
  loading,
  onOpen,
  onMarkRead,
}: {
  notification: Notification;
  index: number;
  loading: boolean;
  onOpen: (
    notification: Notification,
  ) => void | Promise<void>;
  onMarkRead: (
    id: string,
  ) => void | Promise<void>;
}) {
  const config =
    getNotificationConfig(
      notification.type,
    );

  const Icon = config.icon;

  const bookingId =
    extractBookingId(notification);

  const hasNavigation =
    Boolean(bookingId) &&
    isJobNotification(notification);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: Math.min(
          index * 0.04,
          0.25,
        ),
      }}
      className={`group relative overflow-hidden rounded-2xl border bg-card transition ${
        notification.isRead
          ? "border-border"
          : "border-primary/20 bg-primary/[0.02] shadow-sm"
      }`}
    >
      {!notification.isRead && (
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      )}

      <button
        type="button"
        onClick={() =>
          void onOpen(notification)
        }
        className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
      >
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${config.bgClass}`}
        >
          <Icon
            className={`size-5 ${config.iconClass}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3
                className={`truncate text-sm font-semibold ${
                  notification.isRead
                    ? "text-foreground"
                    : "text-primary"
                }`}
              >
                {notification.title}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatNotificationTime(
                  notification.createdAt,
                )}
              </p>
            </div>

            {!notification.isRead && (
              <span className="w-fit rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                New
              </span>
            )}
          </div>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {notification.message}
          </p>

          {bookingId && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
              <CalendarCheck className="size-3.5" />

              Booking:{" "}
              <span className="font-semibold text-foreground">
                {bookingId}
              </span>
            </div>
          )}

          {hasNavigation && (
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open job

              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>

        <ChevronRight className="mt-2 hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
      </button>

      {!notification.isRead && (
        <div className="border-t border-border px-4 py-2 sm:px-5">
          <button
            type="button"
            disabled={loading}
            onClick={(event) => {
              event.stopPropagation();

              void onMarkRead(
                notification.id,
              );
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}

            Mark as read
          </button>
        </div>
      )}
    </motion.div>
  );
}
