"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Star,
  Sparkles,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  slug?: string;
  totalBookings: number;
  rating?: number;
}

export function FeaturedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices((data.services || []).slice(0, 3));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Popular
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Featured Services
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Services customers are booking right now
          </p>
        </div>

        <Link
          href="/customer/services"
          className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <Link
              href={`/customer/services/${
                service.slug || service.id
              }`}
              className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-primary/10 to-muted" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {service.category}
                  </span>

                  <h3 className="mt-2 text-lg font-bold text-white">
                    {service.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold">
                    {service.rating || "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {service.totalBookings} bookings
                  </span>
                </div>

                <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        href="/customer/services"
        className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-primary sm:hidden"
      >
        View all services
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}