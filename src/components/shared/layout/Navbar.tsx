"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ShoppingCart,
  ChevronRight,
  LogOut,
  User,
  X,
  ArrowRight,
  CalendarCheck,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/context/auth-context";
import { serviceDetails } from "@/data/serviceDetails";
import { useCart } from "@/context/cart-context";

interface NavbarProps {
  portal: "admin" | "customer" | "technician";
  onMenuToggle: () => void;
}

export function Navbar({
  portal,
  onMenuToggle,
}: NavbarProps) {
  const router = useRouter();

  const { user, signOut } = useAuth();
  const { items } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     USER
  ========================================================= */

  const phone = user?.phone || "";

  const userName =
    user?.name?.trim() ||
    (phone ? `+91 ${phone}` : "User");

  const initials = (() => {
    const name = user?.name?.trim();

    if (name) {
      const parts = name
        .split(/\s+/)
        .filter(Boolean);

      if (parts.length >= 2) {
        return (
          parts[0].charAt(0) +
          parts[parts.length - 1].charAt(0)
        ).toUpperCase();
      }

      return name.slice(0, 2).toUpperCase();
    }

    return phone
      ? phone.slice(-2).toUpperCase()
      : "ZI";
  })();

  const avatarUrl = user?.id
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}`
    : "";

  const portalLabel =
    portal === "customer"
      ? "Customer"
      : portal === "admin"
        ? "Admin"
        : "Technician";

  /* =========================================================
     CART
  ========================================================= */

  const cartCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /* =========================================================
     SEARCH
  ========================================================= */

  useEffect(() => {
    if (!searchOpen) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchOpen]);

  const filtered = query.trim()
    ? serviceDetails
        .filter((service) => {
          const search = query.toLowerCase();

          return (
            service.isActive &&
            (service.name
              .toLowerCase()
              .includes(search) ||
              service.category
                .toLowerCase()
                .includes(search))
          );
        })
        .slice(0, 6)
    : [];

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const handleSelect = (slug: string) => {
    setQuery("");
    setSearchOpen(false);

    if (portal === "customer") {
      router.push(`/customer/services/${slug}`);
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goNotifications = () => {
    router.push(`/${portal}/notifications`);
  };

  const goProfile = () => {
    router.push(`/${portal}/profile`);
  };

  const goCart = () => {
    router.push("/customer/cart");
  };

  const goBookings = () => {
    router.push("/customer/bookings");
  };

  const goSubscriptions = () => {
    router.push("/customer/subscriptions");
  };

  /* =========================================================
     HEADER
  ========================================================= */

  return (
    <header className="sticky top-0 z-50 h-[72px] w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* =====================================================
          DESKTOP / MAIN HEADER
      ===================================================== */}

      <div className="flex h-full w-full items-center px-4 sm:px-6 lg:px-8">
        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="mr-3 size-10 rounded-xl lg:hidden"
        >
          <Menu className="size-5" />
        </Button>

        {/* ===================================================
            SEARCH
            Model: search starts immediately after sidebar
        =================================================== */}

        <div className="relative flex min-w-0 flex-1 items-center">
          {/* Desktop search */}

          {searchOpen ? (
            <div className="relative hidden w-full max-w-[430px] md:block">
              <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:bg-slate-950">
                <Search className="mr-2.5 size-4 shrink-0 text-slate-400" />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeSearch();
                    }
                  }}
                  placeholder="Search services..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="size-3.5 text-slate-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="ml-1 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="size-4 text-slate-500" />
                </button>
              </div>

              {/* Search results */}

              {query.trim() && (
                <div className="absolute left-0 right-0 top-[54px] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                  {filtered.length > 0 ? (
                    <>
                      <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ziffix Services
                        </p>
                      </div>

                      {filtered.map((service) => (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() =>
                            handleSelect(service.slug)
                          }
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        >
                          <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                            {service.image ? (
                              <img
                                src={service.image}
                                alt={service.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Search className="size-4 text-slate-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {service.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {service.category}
                            </p>
                          </div>

                          <ArrowRight className="size-4 shrink-0 text-slate-400" />
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <Search className="mx-auto size-5 text-slate-400" />

                      <p className="mt-3 text-sm font-semibold">
                        No services found
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Try another service name or category.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-11 w-full max-w-[430px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-600 md:flex dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950"
            >
              <Search className="size-4 shrink-0" />

              <span>Search services...</span>

              <span className="ml-auto hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400 lg:block dark:border-slate-700 dark:bg-slate-900">
                /
              </span>
            </button>
          )}
        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {/* =================================================
              MOBILE SEARCH
          ================================================= */}

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setSearchOpen((value) => !value)
            }
            aria-label="Search services"
            className="size-10 rounded-xl md:hidden"
          >
            <Search className="size-5" />
          </Button>

          {/* =================================================
              NOTIFICATION
          ================================================= */}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goNotifications}
            aria-label="Notifications"
            className="relative size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <Bell className="size-[20px] text-slate-700 dark:text-slate-200" />

            <span className="absolute right-[8px] top-[7px] size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
          </Button>

          {/* =================================================
              CART
          ================================================= */}

          {portal === "customer" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goCart}
              aria-label="Shopping cart"
              className="relative size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <ShoppingCart className="size-[20px] text-slate-700 dark:text-slate-200" />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
          )}

          {/* =================================================
              DIVIDER
          ================================================= */}

          <Separator
            orientation="vertical"
            className="mx-1 hidden h-8 sm:block"
          />

          {/* =================================================
              CUSTOMER PROFILE
          ================================================= */}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-11 rounded-2xl px-1.5 sm:px-2"
                />
              }
            >
              <Avatar
                size="sm"
                className="ring-2 ring-primary/10"
              >
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={userName}
                  />
                )}

                <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden max-w-[150px] text-left sm:block">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {userName}
                </p>

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {portalLabel}
                </p>
              </div>

              <ChevronRight className="ml-1 hidden size-3.5 rotate-90 text-slate-400 sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 rounded-2xl border-slate-200 p-1.5 shadow-xl dark:border-slate-800"
            >
              {/* Profile heading */}

              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="default"
                      className="ring-2 ring-primary/10"
                    >
                      {avatarUrl && (
                        <AvatarImage
                          src={avatarUrl}
                          alt={userName}
                        />
                      )}

                      <AvatarFallback className="bg-primary font-bold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {userName}
                      </p>

                      <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                        Ziffix {portalLabel} Account
                      </p>

                      {phone && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          +91 {phone}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Profile */}

              <DropdownMenuItem
                onClick={goProfile}
                className="rounded-xl px-3 py-2.5"
              >
                <User className="mr-2.5 size-4" />
                Profile
              </DropdownMenuItem>

              {/* Customer links */}

              {portal === "customer" && (
                <>
                  <DropdownMenuItem
                    onClick={goBookings}
                    className="rounded-xl px-3 py-2.5"
                  >
                    <CalendarCheck className="mr-2.5 size-4" />
                    My Bookings
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={goSubscriptions}
                    className="rounded-xl px-3 py-2.5"
                  >
                    <Crown className="mr-2.5 size-4" />
                    Subscription
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Logout */}

              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut()}
                className="rounded-xl px-3 py-2.5"
              >
                <LogOut className="mr-2.5 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* =====================================================
          MOBILE SEARCH PANEL
      ===================================================== */}

      {searchOpen && (
        <div className="border-t border-slate-200 bg-white px-3 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="relative">
            <div className="flex h-11 items-center rounded-2xl border border-primary/20 bg-slate-50 px-3 dark:bg-slate-900">
              <Search className="mr-2.5 size-4 text-slate-400" />

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search services..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="size-4 text-slate-400" />
                </button>
              )}

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="ml-1 rounded-full p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="size-4 text-slate-500" />
              </button>
            </div>

            {/* Mobile search results */}

            {query.trim() && (
              <div className="absolute left-0 right-0 top-[54px] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                {filtered.length > 0 ? (
                  filtered.map((service) => (
                    <button
                      key={service.slug}
                      type="button"
                      onClick={() =>
                        handleSelect(service.slug)
                      }
                      className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                    >
                      <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Search className="size-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {service.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {service.category}
                        </p>
                      </div>

                      <ArrowRight className="size-4 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-7 text-center">
                    <Search className="mx-auto size-5 text-slate-400" />

                    <p className="mt-2 text-sm font-semibold">
                      No services found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try another search.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}