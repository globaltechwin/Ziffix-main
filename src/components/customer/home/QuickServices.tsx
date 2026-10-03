"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Zap,
} from "lucide-react";

import { referenceServiceSlugs } from "../../../../prisma/data/referenceServices";

interface Service {
  id: string;
  name: string;
  image?: string;
  slug?: string;
}

export function QuickServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        const all = data.services || [];

        const phaseOne = all.filter((service: Service) =>
          referenceServiceSlugs.has(service.slug || "")
        );

        const existing = all.filter(
          (service: Service) =>
            !referenceServiceSlugs.has(service.slug || "")
        );

        setServices([...phaseOne, ...existing].slice(0, 4));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border bg-gradient-to-br from-primary/5 to-background p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (services.length === 0) return null;

  return (
    <section className="rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-blue-50/50 p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Fast booking
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Quick Services
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Book popular services in just a few clicks
          </p>
        </div>

        <Link
          href="/customer/services"
          className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex"
        >
          Explore
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -3 }}
          >
            <Link
              href={`/customer/services/${
                service.slug || service.id
              }`}
              className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-primary/10 to-muted" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-semibold text-white">
                    {service.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Book now
                </span>
                <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}