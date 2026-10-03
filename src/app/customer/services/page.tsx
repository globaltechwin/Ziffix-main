"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import {
  ArrowRight,
  Bath,
  Blinds,
  Fan,
  Grid3X3,
  Home,
  Loader2,
  Search,
  Snowflake,
  Sofa,
  Sparkles,
  Sun,
  Utensils,
  ShieldCheck,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { createServiceSlug, getServiceImage } from "@/lib/service-images";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  image?: string;
  slug?: string;
  isActive: boolean;
  rating: number;
  totalBookings: number;
}

/* =========================================================
   CATEGORY ICONS
========================================================= */

const categoryIcons: Record<string, LucideIcon> = {
  Cleaning: Sparkles,
  "Home Cleaning": Home,
  "Bathroom Cleaning": Bath,
  "Kitchen Cleaning": Utensils,
  "Sofa & Carpet Cleaning": Sofa,
  "AC Service & Repair": Snowflake,
  HVAC: Snowflake,
  "Mosquito & Safety Nets": ShieldCheck,
  "Curtain Care": Blinds,
  "Solar Panel Cleaning": Sun,
  "Fan Cleaning": Fan,
  "Exhaust Fan Cleaning": Fan,
  "Home Deep Cleaning": Sparkles,
  "Full Home Deep Cleaning": Home,
  "Cleaning Subscriptions": Home,
};

/* =========================================================
   CATEGORY COLORS
========================================================= */

const categoryColors: Record<string, string> = {
  "Home Cleaning": "#2563eb",
  "Bathroom Cleaning": "#0ea5e9",
  "Kitchen Cleaning": "#f97316",
  "Sofa & Carpet Cleaning": "#8b5cf6",
  "AC Service & Repair": "#06b6d4",
  "Mosquito & Safety Nets": "#14b8a6",
  "Curtain Care": "#ec4899",
  "Solar Panel Cleaning": "#eab308",
  "Fan Cleaning": "#6366f1",
  "Exhaust Fan Cleaning": "#64748b",
  "Home Deep Cleaning": "#22c55e",
  "Full Home Deep Cleaning": "#059669",
  "Cleaning Subscriptions": "#7c3aed",
};

/* =========================================================
   SHARED SERVICE IMAGES
========================================================= */

/* =========================================================
   ANIMATION
========================================================= */

const gridAnimation = {
  hidden: {
    opacity: 0,
  },

  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardAnimation = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  show: {
    opacity: 1,
    y: 0,
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function CustomerServicesPage() {
  const [services, setServices] = useState<
    Service[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [category, setCategory] =
    useState("All");

  /* =======================================================
     LOAD SERVICES
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const response = await fetch(
          "/api/services"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load services"
          );
        }

        const data =
          await response.json();

        if (!active) {
          return;
        }

        const loadedServices =
          Array.isArray(data?.services)
            ? data.services
            : [];

        setServices(
          loadedServices.filter(
            (service: Service) =>
              service.isActive !== false
          )
        );
      } catch {
        if (active) {
          setServices([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const uniqueCategories =
      Array.from(
        new Set(
          services
            .map(
              (service) =>
                service.category
            )
            .filter(Boolean)
        )
      );

    return [
      "All",
      ...uniqueCategories,
    ];
  }, [services]);

  /* =======================================================
     FILTER SERVICES
  ======================================================= */

  const filteredServices = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return services.filter(
      (service) => {
        const matchesCategory =
          category === "All" ||
          service.category === category;

        const matchesSearch =
          !normalizedQuery ||
          service.name
            .toLowerCase()
            .includes(
              normalizedQuery
            ) ||
          service.category
            .toLowerCase()
            .includes(
              normalizedQuery
            ) ||
          service.description
            .toLowerCase()
            .includes(
              normalizedQuery
            );

        return (
          matchesCategory &&
          matchesSearch
        );
      }
    );
  }, [
    services,
    query,
    category,
  ]);

  /* =======================================================
     CARD
  ======================================================= */

  const renderServiceCard = (
    service: Service
  ) => {
    const Icon =
      categoryIcons[
        service.category
      ] || Grid3X3;

    const iconColor =
      categoryColors[
        service.category
      ] || "#2563eb";

    /*
     * IMPORTANT:
     * Never allow /undefined in the URL.
     */
    const slug =
      createServiceSlug(service);

    const image =
      getServiceImage(service);

    /*
     * If a service has absolutely no usable
     * identifier, do not create a broken link.
     */
    const serviceHref = slug
      ? `/customer/services/${encodeURIComponent(
          slug
        )}`
      : "/customer/services";

    return (
      <motion.div
        key={service.id}
        variants={cardAnimation}
        whileHover={{
          y: -3,
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <Link
          href={serviceHref}
          className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
        >
          {/* IMAGE */}

          <div className="relative h-[170px] overflow-hidden bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={service.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                onError={(event) => {
                  /*
                   * If an external image fails,
                   * hide the broken image and show
                   * the normal fallback area.
                   */
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : null}

            {!image && (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                <div
                  className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm"
                  style={{
                    color: iconColor,
                  }}
                >
                  <Icon className="size-7" />
                </div>
              </div>
            )}

            {/* IMAGE OVERLAY */}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

            {/* CATEGORY BADGE */}

            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                {service.category}
              </span>
            </div>
          </div>

          {/* CONTENT */}

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-slate-900">
                  {service.name}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-slate-500">
                  {service.description}
                </p>
              </div>

              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <ArrowRight className="size-4" />
              </span>
            </div>

            {/* BOTTOM INFORMATION */}

            <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
              <div>
                <p className="text-[10px] text-slate-400">
                  From
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {service.basePrice >
                  0
                    ? `₹${service.basePrice.toLocaleString(
                        "en-IN"
                      )}`
                    : "Price on request"}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-amber-500">
                    ★
                  </span>

                  <span className="text-xs font-medium text-slate-700">
                    {service.rating >
                    0
                      ? service.rating.toFixed(
                          1
                        )
                      : "New"}
                  </span>
                </div>

                {service.totalBookings >
                  0 && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {
                      service.totalBookings
                    }{" "}
                    bookings
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-full bg-[#f7faff]">
      <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* =================================================
            HERO / PAGE HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white px-5 py-5 sm:px-7 sm:py-6">

          <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-blue-100/40 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-52 rounded-full bg-sky-100/40 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">

                <div className="mb-2 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Home className="size-4" />
                  </div>

                  <span className="text-xs font-semibold text-blue-600">
                    Ziffix Home Services
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Our Services
                </h1>

                <p className="mt-1.5 max-w-xl text-sm leading-5 text-slate-500">
                  Choose from a wide range of professional
                  home services designed to keep your home
                  clean, comfortable and well maintained.
                </p>
              </div>

              {/* SEARCH */}

              <div className="w-full max-w-[340px]">
                <div className="relative">

                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search services..."
                    className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-sm"
                  />

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =================================================
            CATEGORY FILTERS
        ================================================= */}

        <section className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">

            {categories.map(
              (entry) => {
                const selected =
                  category === entry;

                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() =>
                      setCategory(
                        entry
                      )
                    }
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {entry}
                  </button>
                );
              }
            )}

          </div>
        </section>

        {/* =================================================
            SERVICE HEADER
        ================================================= */}

        <section className="mt-6">

          <div className="mb-4 flex items-end justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Services
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Professional services for your home
              </p>
            </div>

            {!loading && (
              <span className="text-xs font-medium text-slate-400">
                {
                  filteredServices.length
                }{" "}
                {
                  filteredServices.length ===
                  1
                    ? "service"
                    : "services"
                }
              </span>
            )}

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

              <div className="flex flex-col items-center gap-3">

                <Loader2 className="size-7 animate-spin text-blue-600" />

                <p className="text-sm text-slate-500">
                  Loading services...
                </p>

              </div>

            </div>
          ) : filteredServices.length ===
            0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Search className="size-5" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No services found
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Try another service name or select a
                different category.
              </p>

              {(query ||
                category !==
                  "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory(
                      "All"
                    );
                  }}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Clear filters
                </button>
              )}

            </div>
          ) : (

            /* =================================================
               SERVICE GRID
            ================================================= */

            <motion.div
              variants={gridAnimation}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredServices.map(
                renderServiceCard
              )}
            </motion.div>

          )}

        </section>

        {/* =================================================
            BOTTOM INFO
        ================================================= */}

        {!loading &&
          filteredServices.length >
            0 && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-slate-600">
                  Need help choosing a service?
                </p>

                <Link
                  href="/customer/services"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Explore all services

                  <ArrowRight className="size-3.5" />
                </Link>

              </div>

            </div>
          )}

      </div>
    </main>
  );
}
