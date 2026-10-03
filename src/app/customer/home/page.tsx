"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  Droplets,
  Fan,
  Loader2,
  Search,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getServiceImage } from "@/lib/service-images";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  image?: string | null;
  slug?: string | null;
  rating?: number;
  totalBookings?: number;
  isActive?: boolean;
}

/* =========================================================
   QUICK SERVICES
========================================================= */

const quickServices = [
  {
    name: "Cleaning",
    icon: Sparkles,
    search: "cleaning",
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    name: "AC Service",
    icon: Fan,
    search: "ac",
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  {
    name: "Plumbing",
    icon: Droplets,
    search: "plumbing",
    iconClass: "bg-sky-50 text-sky-600",
  },
  {
    name: "Electrical",
    icon: Bolt,
    search: "electrical",
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    name: "Laundry",
    icon: Zap,
    search: "laundry",
    iconClass: "bg-rose-50 text-rose-600",
  },
];

/* =========================================================
   FALLBACK HERO IMAGE
========================================================= */

const fallbackHeroImage =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=90";

/* =========================================================
   CUSTOMER HOME
========================================================= */

export default function CustomerHomePage() {
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* =======================================================
     CUSTOMER NAME
  ======================================================= */

  const customerName = useMemo(() => {
    const name = user?.name?.trim();

    if (!name) {
      return "Customer";
    }

    return name.split(/\s+/)[0];
  }, [user?.name]);

  /* =======================================================
     LOAD SERVICES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/services");

        if (!response.ok) {
          throw new Error("Failed to load services");
        }

        const data = await response.json();

        if (!mounted) {
          return;
        }

        const serviceList: Service[] = Array.isArray(data?.services)
          ? data.services
          : [];

        setServices(
          serviceList.filter(
            (service) => service.isActive !== false
          )
        );
      } catch (error) {
        console.error("Failed to load customer services:", error);

        if (mounted) {
          setServices([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     FEATURED SERVICES
     Exactly 4 cards like the existing customer home page.
  ======================================================= */

  const featuredServices = useMemo(() => {
    return services.slice(0, 4);
  }, [services]);

  /* =======================================================
     ALL SERVICES CATEGORIES
  ======================================================= */

  const serviceCategories = useMemo(() => {
    const categories = services
      .map((service) => service.category?.trim())
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(categories))];
  }, [services]);

  /* =======================================================
     FILTERED ALL SERVICES
  ======================================================= */

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === "All" ||
        service.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        service.name,
        service.category,
        service.description,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [services, serviceSearch, selectedCategory]);

  /* =======================================================
     HERO IMAGE
  ======================================================= */

  const heroImage =
    services.map((service) => getServiceImage(service)).find(Boolean) ||
    fallbackHeroImage;

  /* =======================================================
     SERVICE URL
  ======================================================= */

  const getServiceUrl = (service: Service) => {
    return `/customer/services/${encodeURIComponent(
      service.slug || service.id
    )}`;
  };

  /* =======================================================
     QUICK SERVICE ACTION
  ======================================================= */

  const getQuickServiceUrl = (search: string) => {
    return `/customer/services?search=${encodeURIComponent(search)}`;
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f7faff]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-blue-600" />

          <p className="text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="min-h-full bg-[#f7faff]">
      <style jsx global>{`
        @keyframes ziffixFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ziffixFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes ziffixSlowZoom {
          from {
            transform: scale(1.04);
          }
          to {
            transform: scale(1.1);
          }
        }

        @keyframes ziffixFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .ziffix-fade-up {
          animation: ziffixFadeUp 0.55s ease-out both;
        }

        .ziffix-fade-in {
          animation: ziffixFadeIn 0.65s ease-out both;
        }

        .ziffix-hero-image {
          animation: ziffixSlowZoom 8s ease-in-out infinite alternate;
        }

        .ziffix-float {
          animation: ziffixFloat 3.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ziffix-fade-up,
          .ziffix-fade-in,
          .ziffix-hero-image,
          .ziffix-float {
            animation: none !important;
          }
        }
      `}</style>

      <div className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
        {/* =================================================
            WELCOME BANNER
        ================================================= */}

        <section className="ziffix-fade-up relative mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#e6f4ff] via-[#edf8ff] to-white shadow-sm">
          <div className="relative grid min-h-[245px] grid-cols-1 lg:grid-cols-[1fr_48%]">
            {/* Left content */}
            <div className="relative z-10 flex flex-col justify-center px-7 py-8 sm:px-9 lg:px-10">
              {/* Small heading */}
              <div className="mb-3 flex items-center gap-2">
                <div className="ziffix-float flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Sparkles className="size-4" />
                </div>

                <span className="text-sm font-semibold text-blue-600">
                  Ziffix Home Services
                </span>
              </div>

              {/* Welcome */}
              <h1 className="text-3xl font-bold tracking-tight text-[#09255f] sm:text-4xl">
                Welcome To, {customerName}!
              </h1>

              {/* Description */}
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Book trusted home services and keep your home
                sparkling clean and comfortable.
              </p>

              {/* Button */}
              <div className="mt-6">
                <Link
                  href="/customer/services"
                  className="group inline-flex h-11 items-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                >
                  Explore Services
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right image */}
            <div className="relative hidden min-h-[245px] overflow-hidden lg:block">
              <img
                src={heroImage}
                alt="Ziffix home services"
                className="ziffix-hero-image absolute inset-0 size-full object-cover"
              />

              {/* Image fade */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#e9f6ff] via-[#e9f6ff]/55 to-transparent" />

              {/* Soft white overlay */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#e9f6ff] to-transparent" />
            </div>
          </div>
        </section>

        {/* =================================================
            QUICK SERVICES
        ================================================= */}

        <section
          className="ziffix-fade-up mb-9"
          style={{ animationDelay: "100ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#071d4d]">
              Quick Services
            </h2>

            <Link
              href="/customer/services"
              className="group flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickServices.map((service, index) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.name}
                  href={getQuickServiceUrl(service.search)}
                  className="ziffix-fade-up group flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  style={{ animationDelay: `${140 + index * 70}ms` }}
                >
                  <div
                    className={`flex size-11 items-center justify-center rounded-full transition duration-300 group-hover:scale-110 ${service.iconClass}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#10265a]">
                    {service.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =================================================
            FEATURED SERVICES
        ================================================= */}

        <section
          className="ziffix-fade-up"
          style={{ animationDelay: "220ms" }}
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#071d4d]">
                Featured Services
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Popular home services for you
              </p>
            </div>

            <Link
              href="/customer/services"
              className="group mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {featuredServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Search className="mx-auto size-8 text-slate-400" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No services available
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Services will appear here once they are available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredServices.map((service, index) => (
                <Link
                  key={service.id}
                  href={getServiceUrl(service)}
                  className="ziffix-fade-up group overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  style={{ animationDelay: `${260 + index * 80}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-[175px] overflow-hidden bg-slate-100">
                    {getServiceImage(service) ? (
                      <img
                        src={getServiceImage(service)}
                        alt={service.name}
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-blue-50">
                        <Sparkles className="size-10 text-blue-300" />
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-blue-600 shadow-sm backdrop-blur">
                        {service.category}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[#09255f]">
                      {service.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[36px] text-xs leading-5 text-slate-500">
                      {service.description ||
                        "Professional home service from trusted Ziffix professionals."}
                    </p>

                    <div className="mt-4 flex items-end justify-between">
                      {/* Price */}
                      <div>
                        <p className="text-[10px] text-slate-400">
                          From
                        </p>

                        <p className="mt-0.5 text-lg font-bold text-[#071d4d]">
                          ₹
                          {service.basePrice.toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5">
                        <Star className="size-4 fill-amber-400 text-amber-400" />

                        <span className="text-xs font-semibold text-slate-700">
                          {service.rating && service.rating > 0
                            ? service.rating.toFixed(1)
                            : "New"}
                        </span>

                        {service.totalBookings &&
                        service.totalBookings > 0 ? (
                          <span className="text-[10px] text-slate-400">
                            ({service.totalBookings})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            ALL SERVICES
        ================================================= */}

        <section
          id="all-services"
          className="ziffix-fade-up mt-12 scroll-mt-6"
          style={{ animationDelay: "350ms" }}
        >
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Sparkles className="size-4" />
                </div>

                <h2 className="text-xl font-bold text-[#071d4d]">
                  All Services
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Explore all professional services available through Ziffix.
              </p>
            </div>

            <Link
              href="/customer/services"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View full services page
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Search */}
          <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                placeholder="Search all services..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {serviceSearch ? (
                <button
                  type="button"
                  onClick={() => setServiceSearch("")}
                  aria-label="Clear service search"
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            {/* Categories */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {serviceCategories.map((category) => {
                const active = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition duration-300 ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#10265a]">
              {selectedCategory === "All"
                ? "All available services"
                : selectedCategory}
            </p>

            <p className="text-xs text-slate-500">
              {filteredServices.length} service
              {filteredServices.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <Search className="mx-auto size-9 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No matching services found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try another service name or choose a different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setServiceSearch("");
                  setSelectedCategory("All");
                }}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service, index) => (
                <Link
                  key={service.id}
                  href={getServiceUrl(service)}
                  className="ziffix-fade-up group overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-xl"
                  style={{
                    animationDelay: `${Math.min(index * 45, 450)}ms`,
                  }}
                >
                  {/* Image */}
                  <div className="relative h-[170px] overflow-hidden bg-slate-100">
                    {getServiceImage(service) ? (
                      <img
                        src={getServiceImage(service)}
                        alt={service.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-blue-50">
                        <Sparkles className="size-10 text-blue-300 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-blue-600 shadow-sm backdrop-blur">
                        {service.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-sm font-bold text-[#09255f]">
                      {service.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[36px] text-xs leading-5 text-slate-500">
                      {service.description ||
                        "Professional home service from trusted Ziffix professionals."}
                    </p>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400">
                          From
                        </p>

                        <p className="mt-0.5 text-lg font-bold text-[#071d4d]">
                          ₹
                          {service.basePrice.toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Star className="size-4 fill-amber-400 text-amber-400" />

                        <span className="text-xs font-semibold text-slate-700">
                          {service.rating && service.rating > 0
                            ? service.rating.toFixed(1)
                            : "New"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            BOOKING CTA
        ================================================= */}

        <section
          className="ziffix-fade-up mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-[#08265f] via-[#0b3c91] to-blue-600 px-7 py-9 text-white shadow-lg sm:px-10"
          style={{ animationDelay: "450ms" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                Ready when you are
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Need a service for your home?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Choose a service, select your preferred option, and continue to booking in just a few clicks.
              </p>
            </div>

            <Link
              href="/customer/services"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explore All Services
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* =================================================
            MOBILE SEARCH
            Kept at bottom so mobile users can still search.
        ================================================= */}

        <div className="mt-7 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search services..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  window.location.href = `/customer/services?search=${encodeURIComponent(
                    event.currentTarget.value
                  )}`;
                }
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
