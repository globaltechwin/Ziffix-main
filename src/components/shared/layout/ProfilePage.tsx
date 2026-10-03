"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Info,
  LogOut,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function ProfilePage() {
  const { user } = useAuth();
  const pathname = usePathname();

  const phone = user?.phone || "";

  /*
   * The same ProfilePage component is used by:
   * /customer/profile
   * /technician/profile
   * /admin/profile
   *
   * Use the current portal URL so the correct portal
   * name is displayed even when user.name is empty.
   */
  const portal =
    pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/technician")
        ? "technician"
        : "customer";

  const profileName =
    portal === "admin"
      ? "Administrator"
      : portal === "technician"
        ? "Technician"
        : "Customer";

  const accountLabel =
    portal === "admin"
      ? "Ziffix Administrator"
      : portal === "technician"
        ? "Ziffix Technician"
        : "Ziffix Customer";

  /*
   * If the user's real name exists, keep showing it.
   * If the database name is empty/null, show the correct
   * portal name instead of the generic "User".
   */
  const name = user?.name || profileName;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  const avatarUrl = user?.id
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`
    : "";

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =====================================================
            PROFILE HERO
        ===================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative p-6 sm:p-8">

            {/* Small heading */}
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" />
              Ziffix Account
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              {/* User */}
              <div className="flex items-center gap-4 sm:gap-5">

                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md" />

                  <Avatar
                    size="lg"
                    className="relative size-20 border-4 border-white shadow-lg dark:border-slate-900 sm:size-24"
                  >
                    {avatarUrl && (
                      <AvatarImage
                        src={avatarUrl}
                        alt="Ziffix user"
                      />
                    )}

                    <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground sm:text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Welcome back
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {name}
                  </h1>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <UserRound className="size-3.5" />
                      {accountLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Phone className="size-5 text-primary" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Mobile number
                  </p>

                  <p className="mt-0.5 text-sm font-semibold">
                    {phone ? `+91 ${phone}` : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* =====================================================
            ACCOUNT SHORTCUTS
        ===================================================== */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <ProfileAction
            href="/customer/bookings"
            icon={<CalendarCheck className="size-5" />}
            title="My Bookings"
            description="View your services"
          />

          <ProfileAction
            href="/customer/subscriptions"
            icon={<Sparkles className="size-5" />}
            title="Subscription"
            description="Manage your plan"
          />

          <ProfileAction
            href="/customer/notifications"
            icon={<Bell className="size-5" />}
            title="Notifications"
            description="View updates"
          />

          <ProfileAction
            href="/customer/settings"
            icon={<Shield className="size-5" />}
            title="Settings"
            description="Manage your account"
          />
        </section>

        {/* =====================================================
            PERSONAL INFORMATION
        ===================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Account information
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Personal information
              </h2>
            </div>

            <div className="hidden size-11 items-center justify-center rounded-xl bg-primary/10 sm:flex">
              <UserRound className="size-5 text-primary" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <InfoCard
              icon={<UserRound className="size-5" />}
              label="Full Name"
              value={name}
            />

            <InfoCard
              icon={<Phone className="size-5" />}
              label="Mobile Number"
              value={phone ? `+91 ${phone}` : "Not available"}
            />

            <InfoCard
              icon={<MapPin className="size-5" />}
              label="Service Address"
              value="Manage during booking"
            />

            <InfoCard
              icon={<Clock3 className="size-5" />}
              label="Account"
              value={accountLabel}
            />
          </div>
        </motion.section>

        {/* =====================================================
            PASSWORD / SECURITY
        ===================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Account security
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Password & security
              </h2>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40 sm:p-5">
            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                <Info className="size-4 text-blue-600 dark:text-blue-300" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Request Password Reset
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-300">
                  To reset your password, please contact your administrator.
                  They will verify your identity and reset your password.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* =====================================================
            ZIFFIX ACCOUNT MENU
        ===================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Quick access
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Manage your Ziffix account
            </h2>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">

            <AccountMenuItem
              href="/customer/bookings"
              icon={<CalendarCheck className="size-5" />}
              title="My Bookings"
              description="Track upcoming and previous bookings"
            />

            <AccountMenuItem
              href="/customer/subscriptions"
              icon={<Sparkles className="size-5" />}
              title="Subscriptions"
              description="View or manage your Ziffix subscription"
            />

            <AccountMenuItem
              href="/customer/notifications"
              icon={<Bell className="size-5" />}
              title="Notifications"
              description="View booking and account notifications"
            />

            <AccountMenuItem
              href="/customer/settings"
              icon={<Shield className="size-5" />}
              title="Settings"
              description="Manage application preferences"
            />
          </div>
        </motion.section>

        {/* =====================================================
            MEMBER NOTE
        ===================================================== */}
        <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Your Ziffix account
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use your account to manage bookings, subscriptions,
                notifications and other Ziffix services.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* =============================================================
   PROFILE ACTION CARD
============================================================= */

function ProfileAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </motion.div>
    </Link>
  );
}

/* =============================================================
   INFORMATION CARD
============================================================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-slate-900">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =============================================================
   ACCOUNT MENU ITEM
============================================================= */

function AccountMenuItem({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:p-5"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}