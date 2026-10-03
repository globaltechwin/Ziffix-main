"use client";

import { getServiceImage } from "@/lib/service-images";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Search,
  ShieldCheck,
  Repeat2,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  slug?: string;
  basePrice: number;
  duration?: number;
  totalBookings?: number;
  rating?: number;
}

const fallbackServices: Service[] = [
  {
    id: "home-cleaning",
    name: "Home Cleaning",
    description: "Professional cleaning for a fresh and healthy home.",
    category: "Cleaning",
    basePrice: 999,
    duration: 120,
    slug: "home-cleaning",
  },
  {
    id: "bathroom-cleaning",
    name: "Bathroom Cleaning",
    description: "Deep cleaning for bathrooms and sanitary areas.",
    category: "Cleaning",
    basePrice: 499,
    duration: 60,
    slug: "bathroom-cleaning",
  },
  {
    id: "kitchen-cleaning",
    name: "Kitchen Cleaning",
    description: "Detailed cleaning for your kitchen and appliances.",
    category: "Cleaning",
    basePrice: 599,
    duration: 90,
    slug: "kitchen-cleaning",
  },
  {
    id: "ac-service-repair",
    name: "AC Service & Repair",
    description: "Professional AC servicing, inspection and repair.",
    category: "AC Service",
    basePrice: 799,
    duration: 60,
    slug: "ac-service-repair",
  },
  {
    id: "sofa-carpet-cleaning",
    name: "Sofa & Carpet Cleaning",
    description: "Deep cleaning for sofas, carpets and fabric surfaces.",
    category: "Cleaning",
    basePrice: 699,
    duration: 90,
    slug: "sofa-carpet-cleaning",
  },
  {
    id: "curtain-care",
    name: "Curtain Care",
    description: "Professional curtain cleaning and care.",
    category: "Cleaning",
    basePrice: 399,
    duration: 60,
    slug: "curtain-care",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Trusted Professionals",
    description: "Verified and trained service professionals.",
  },
  {
    icon: Clock3,
    title: "Easy Booking",
    description: "Book your required service in just a few clicks.",
  },
  {
    icon: Sparkles,
    title: "Quality Service",
    description: "Professional service with attention to detail.",
  },
  {
    icon: Users,
    title: "Customer Support",
    description: "We are here to help whenever you need us.",
  },
];

const popularCategories = [
  "Home Cleaning",
  "Bathroom Cleaning",
  "Kitchen Cleaning",
  "AC Service & Repair",
  "Sofa & Carpet Cleaning",
  "Home Deep Cleaning",
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const response = await fetch("/api/services");

        if (!response.ok) {
          throw new Error("Failed to load services");
        }

        const data = await response.json();

        if (active) {
          setServices(
            Array.isArray(data?.services) ? data.services : []
          );
        }
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

  useEffect(() => {
    const sectionIds = [
      "home",
      "services",
      "why-ziffix",
      "booking-details",
      "subscriptions",
      "how-it-works",
    ];

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const displayedServices = useMemo(() => {
    const source =
      services.length > 0 ? services : fallbackServices;

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return source;
    }

    return source.filter((service) => {
      return (
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.category
          .toLowerCase()
          .includes(normalizedQuery) ||
        service.description
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [services, query]);

  const handleSearch = () => {
    const element = document.getElementById("services");

    element?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "why-ziffix", label: "Why Ziffix" },
    { id: "booking-details", label: "Booking" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "how-it-works", label: "How It Works" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Ziffix Home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="size-5" />
            </span>

            <span className="text-xl font-bold tracking-tight">
              Ziffix
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-medium transition ${
                  activeSection === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted sm:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        id="home"
        className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background"
      >
        <div className="absolute -left-32 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:items-center lg:px-8">
          {/* Hero content */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="size-3.5" />
              Ziffix Home Services
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Professional home services
              <span className="block text-primary">
                at your doorstep.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Keep your home clean, comfortable and well maintained
              with trusted professionals from Ziffix.
            </p>

            {/* Search */}
            <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search home cleaning, AC service..."
                  className="h-12 w-full rounded-xl border bg-background pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Search className="size-4" />
                Search
              </button>
            </div>

            {/* Popular searches */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Popular:
              </span>

              {popularCategories.slice(0, 4).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setQuery(category);
                    window.setTimeout(handleSearch, 0);
                  }}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Hero buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Explore Services
                <ArrowRight className="size-4" />
              </a>

              {/* IMPORTANT:
                  This goes to the EXISTING sign-in page.
                  We are not creating a new login page.
              */}
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl border bg-background px-6 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border bg-card shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                    src="https://i.ibb.co/hxBypZnG/Whats-App-Image-2026-09-30-at-3-06-11-PM.jpg"
                    alt="Professional Ziffix home cleaning service"
                    className="h-full w-full object-cover object-center"
                  />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute bottom-8 left-0 right-0 p-6 text-white">
                  <p className="text-sm font-medium text-white/80">
                    Trusted home care
                  </p>

                  <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Your home. Our care.
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                    Book reliable home services whenever you need
                    them.
                  </p>
                </div>
              </div>
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border bg-background p-4 shadow-lg sm:block">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Trusted professionals
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Quality service at your doorstep
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BENEFITS
      ========================================================= */}
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y px-4 sm:px-6 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 lg:px-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="flex items-center gap-4 px-5 py-6 lg:px-6"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    {benefit.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          SERVICES
      ========================================================= */}
      <section
        id="services"
        className="scroll-mt-20 bg-muted/30 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />

                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Our Services
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your home needs
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Browse Ziffix home services and choose the service
                that fits your needs.
              </p>
            </div>

            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Sign in to book
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border bg-card"
                >
                  <div className="h-44 animate-pulse bg-muted" />

                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading &&
            displayedServices.length === 0 && (
              <div className="mt-8 rounded-2xl border bg-card p-10 text-center">
                <Search className="mx-auto size-8 text-muted-foreground" />

                <h3 className="mt-3 text-lg font-semibold">
                  No services found
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try searching for another home service.
                </p>
              </div>
            )}

          {/* Service cards */}
          {!loading &&
            displayedServices.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {displayedServices.map((service) => (
                  <div
                    key={service.id}
                    className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden bg-muted">
                      {getServiceImage(service) ? (
                        <img
                          src={getServiceImage(service)}
                          alt={service.name}
                          className="size-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-primary/5">
                          <Home className="size-12 text-primary/40" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
                        {service.category}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">
                          {service.name}
                        </h3>

                        <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Star className="size-3.5 fill-current text-yellow-500" />

                          {service.rating
                            ? service.rating
                            : "New"}
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {service.description}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Starting from
                          </p>

                          <p className="text-lg font-bold text-primary">
                            {service.basePrice > 0
                              ? `₹${service.basePrice}`
                              : "On request"}
                          </p>
                        </div>

                        <Link
                          href="/sign-in"
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                          Sign In
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      {/* =========================================================
          BOOKING DETAILS
      ========================================================= */}
      <section
        id="booking-details"
        className="border-b bg-background py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Booking Details
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Book a home service in a few simple steps
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Choose a service, select the details you need, and continue through the existing Ziffix booking flow after signing in.
              </p>

              <Link
                href="/sign-in"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Start a Booking
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Search,
                  number: "01",
                  title: "Choose a service",
                  description: "Browse all available services and open the one that matches your needs.",
                },
                {
                  icon: CalendarDays,
                  number: "02",
                  title: "Select booking details",
                  description: "Continue with the existing customer booking flow to provide your service details and schedule.",
                },
                {
                  icon: ShieldCheck,
                  number: "03",
                  title: "Confirm your booking",
                  description: "Review the service information and confirm the booking through your customer account.",
                },
                {
                  icon: Clock3,
                  number: "04",
                  title: "Manage your booking",
                  description: "Use your existing Ziffix customer area to view and manage your bookings.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.number}
                    className="rounded-2xl border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.number}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SUBSCRIPTION PLANS
      ========================================================= */}
      <section
        id="subscriptions"
        className="scroll-mt-20 bg-muted/30 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2">
              <Repeat2 className="size-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Membership Plans
              </span>
            </div>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your plan
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Select the plan that best fits your home service needs.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                name: "Free",
                description: "Basic access for occasional use",
                price: "Free",
                period: "",
                icon: Star,
                features: [
                  "3 bookings per month",
                  "Basic services only",
                  "Standard support",
                  "Standard response time",
                ],
                featured: false,
              },
              {
                name: "Starter",
                description: "For regular home service needs",
                price: "₹499",
                period: "/ month",
                icon: Sparkles,
                features: [
                  "Unlimited bookings",
                  "All services included",
                  "Priority booking slots",
                  "Monthly maintenance visit",
                  "Email support",
                ],
                featured: true,
              },
              {
                name: "Pro",
                description: "Complete home care solution",
                price: "₹999",
                period: "/ month",
                icon: Sparkles,
                features: [
                  "Unlimited bookings",
                  "All services included",
                  "Instant booking priority",
                  "Free monthly visit",
                  "24/7 priority support",
                  "Extended warranty on services",
                  "Dedicated technician",
                ],
                featured: false,
              },
            ].map((plan) => {
              const Icon = plan.icon;

              return (
                <div
                  key={plan.name}
                  className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl border bg-card shadow-sm ${
                    plan.featured
                      ? "border-primary shadow-md ring-1 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                      Popular
                    </div>
                  )}

                  <div className="p-6 sm:p-7">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>

                    <h3 className="mt-6 text-2xl font-bold">
                      {plan.name}
                    </h3>

                    <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                      {plan.description}
                    </p>

                    <div className="mt-8 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <div className="my-6 border-t" />

                    <p className="text-sm font-semibold">
                      Plan includes
                    </p>

                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto border-t bg-background/60 p-5">
                    <Link
                      href="/sign-in"
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                        plan.featured
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border bg-background hover:bg-muted"
                      }`}
                    >
                      {plan.name === "Free"
                        ? "Get Started"
                        : `Subscribe — ${plan.price}/mo`}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY ZIFFIX
      ========================================================= */}
      <section
        id="why-ziffix"
        className="border-b bg-background py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />

                <span className="text-sm font-semibold text-primary">
                  Why Ziffix
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, reliable home services
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Ziffix brings everyday home maintenance services
                together in one convenient platform.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "Professional service providers",
                  "Convenient online booking",
                  "Clear service and package information",
                  "Reliable customer support",
                  "Easy booking management",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />

                    <span className="text-sm font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Start Using Ziffix
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Home className="size-6" />
                </div>

                <p className="mt-5 text-3xl font-bold">
                  13+
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Home service categories
                </p>
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="size-6" />
                </div>

                <p className="mt-5 text-3xl font-bold">
                  24/7
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Service support
                </p>
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wrench className="size-6" />
                </div>

                <p className="mt-5 text-3xl font-bold">
                  Easy
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Service booking
                </p>
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Star className="size-6" />
                </div>

                <p className="mt-5 text-3xl font-bold">
                  Quality
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Focused service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section
        id="how-it-works"
        className="bg-muted/30 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">
              HOW IT WORKS
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Get your home service in a few simple steps
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Browse services, sign in and continue with the
              existing Ziffix booking process.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose a service",
                description:
                  "Browse the services available on Ziffix and find what your home needs.",
              },
              {
                number: "02",
                title: "Sign in",
                description:
                  "Click Sign In and use the existing Ziffix authentication system.",
              },
              {
                number: "03",
                title: "Book your service",
                description:
                  "After signing in, continue with your existing customer booking flow.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Sparkles className="mx-auto size-8" />

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your home. Our care.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
            Explore Ziffix services and sign in when you are ready
            to book.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              Explore Services
              <ArrowRight className="size-4" />
            </a>

            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Home className="size-6" />
                </span>

                <span className="text-2xl font-extrabold tracking-tight">
                  Ziffix
                </span>
              </Link>

              <p className="mt-5 max-w-md text-sm font-medium leading-7 text-slate-300">
                Professional home services at your doorstep.
                Explore services, understand the booking process,
                and choose a membership plan that fits your home
                service needs.
              </p>

              <Link
                href="/sign-in"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Explore
              </h3>

              <ul className="mt-5 space-y-3">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className="text-left text-sm font-medium text-slate-300 transition hover:text-white"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Popular Services
              </h3>

              <ul className="mt-5 space-y-3">
                {popularCategories.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        handleNavClick("services");
                      }}
                      className="text-left text-sm font-medium text-slate-300 transition hover:text-white"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Account
              </h3>

              <ul className="mt-5 space-y-3">
                <li>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Sign In
                  </Link>
                </li>

                <li>
                  <Link
                    href="/sign-up"
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Create Account
                  </Link>
                </li>

                <li>
                  <a
                    href="#booking-details"
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Booking Details
                  </a>
                </li>

                <li>
                  <a
                    href="#subscriptions"
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Subscription Plans
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7">
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-slate-400">
                © {new Date().getFullYear()} Ziffix. All rights reserved.
              </p>

              <div className="flex items-center gap-2 font-semibold text-slate-300">
                <ShieldCheck className="size-4 text-primary" />
                <span>Your home. Our care.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
