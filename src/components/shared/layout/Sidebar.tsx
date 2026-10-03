"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wrench,
  Home,
  CreditCard,
  Crown,
  BarChart3,
  Settings,
  Search,
  CalendarCheck,
  FileText,
  Bell,
  User,
  UserCog,
  ClipboardList,
  DollarSign,
  Clock,
  LogOut,
  X,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  adminNavItems,
  customerNavItems,
  technicianNavItems,
  type NavItem,
} from "@/lib/constants";

import { useAuth } from "@/context/auth-context";

/* =========================================================
   ICON MAP
========================================================= */

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Calendar,
  Wrench,
  Home,
  CreditCard,
  Crown,
  BarChart3,
  Settings,
  Search,
  CalendarCheck,
  FileText,
  Bell,
  User,
  UserCog,
  ClipboardList,
  DollarSign,
  Clock,
  ShoppingCart,
};

/* =========================================================
   PORTAL ITEMS
========================================================= */

const portalNavItems: Record<string, NavItem[]> = {
  admin: adminNavItems,
  customer: customerNavItems,
  technician: technicianNavItems,
};

/* =========================================================
   PORTAL LABELS
========================================================= */

const portalLabels: Record<string, string> = {
  admin: "Admin Portal",
  customer: "Customer Portal",
  technician: "Technician Portal",
};

/* =========================================================
   PROPS
========================================================= */

interface SidebarProps {
  portal: "admin" | "customer" | "technician";
  mode: "fixed" | "overlay";
  isOpen?: boolean;
  onClose?: () => void;
}

/* =========================================================
   CUSTOMER SIDEBAR
========================================================= */

function CustomerSidebarContent({
  isOverlay,
  onClose,
}: {
  isOverlay: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const {
    user,
    signOut,
  } = useAuth();

  const items = customerNavItems;

  const customerName =
    user?.name?.trim() || "Customer";

  const initials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CU";

  return (
    <div className="flex h-full flex-col bg-[#06295f] text-white">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="flex h-[72px] items-center justify-between px-5">
        <Link
          href="/customer/home"
          onClick={isOverlay ? onClose : undefined}
          className="flex items-center gap-2"
        >
          <div className="flex size-8 items-center justify-center rounded-lg border-2 border-white">
            <Home className="size-4.5 text-white" />
          </div>

          <span className="text-xl font-bold tracking-tight text-white">
            Ziffix
          </span>
        </Link>

        {isOverlay && onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      <div className="mx-4 border-b border-white/10" />

      {/* =====================================================
          CUSTOMER PROFILE
      ===================================================== */}

      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border-2 border-white/80">
            <AvatarFallback className="bg-white text-sm font-bold text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {customerName}
            </p>

            <p className="text-[10px] text-blue-200">
              Customer
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-1.5">

          {items.map((item) => {
            const Icon = iconMap[item.icon];

            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isOverlay ? onClose : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />
                )}

                {Icon && (
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      isActive
                        ? "text-white"
                        : "text-blue-200"
                    )}
                  />
                )}

                <span>{item.title}</span>
              </Link>
            );
          })}

        </div>
      </nav>

      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN / TECHNICIAN SIDEBAR
   Keep existing portal behavior
========================================================= */

function StandardSidebarContent({
  portal,
  isOverlay,
  onClose,
}: {
  portal: "admin" | "technician";
  isOverlay: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const {
    user,
    signOut,
  } = useAuth();

  const items = portalNavItems[portal];

  const phone = user?.phone || "";

  const userName = user?.name?.trim()
    ? user.name
    : phone
      ? `+91 ${phone}`
      : "User";

  const userInitials = user?.name?.trim()
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : phone
      ? phone.slice(-2).toUpperCase()
      : "U";

  return (
    <div className="flex h-full flex-col">

      {/* Logo */}
      <div
        className="flex h-14 items-center justify-between border-b px-4"
        style={{
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <Home className="size-5 shrink-0 text-primary" />

          <span className="text-lg font-bold tracking-tight text-foreground">
            Ziffix
          </span>
        </div>

        {isOverlay && onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon];

            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isOverlay ? onClose : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor:
                          "var(--sidebar-accent)",
                      }
                    : undefined
                }
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      isActive
                        ? "text-primary"
                        : ""
                    )}
                  />
                )}

                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>
              {userInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-foreground">
              {userName}
            </span>

            <span className="truncate text-xs text-muted-foreground">
              {portalLabels[portal]}
            </span>
          </div>

          {isOverlay && onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

export function Sidebar({
  portal,
  mode,
  isOpen,
  onClose,
}: SidebarProps) {
  if (portal === "customer") {
    if (mode === "fixed") {
      return (
        <aside className="hidden h-screen w-[232px] shrink-0 flex-col lg:flex">
          <CustomerSidebarContent
            isOverlay={false}
          />
        </aside>
      );
    }

    return (
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col transition-transform duration-300",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        <CustomerSidebarContent
          isOverlay
          onClose={onClose}
        />
      </div>
    );
  }

  if (mode === "fixed") {
    return (
      <aside
        className="hidden h-screen w-56 shrink-0 flex-col border-r lg:flex"
        style={{
          backgroundColor: "var(--sidebar)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        <StandardSidebarContent
          portal={portal}
          isOverlay={false}
        />
      </aside>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300",
        isOpen
          ? "translate-x-0"
          : "-translate-x-full"
      )}
      style={{
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      <StandardSidebarContent
        portal={portal}
        isOverlay
        onClose={onClose}
      />
    </div>
  );
}
