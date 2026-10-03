"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";

import {
  Shirt,
  Car,
  Home,
  Wind,
  Bug,
  Zap,
  Wrench,
  Grid3X3,
  LayoutGrid,
  Loader2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Service {
  id: string;
  category: string;
}

interface Category {
  name: string;
  icon: LucideIcon;
  color: string;
  count: number;
  href: string;
}

const categoryMeta: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  Laundry: { icon: Shirt, color: "#8b5cf6" },
  "Car Wash": { icon: Car, color: "#3b82f6" },
  Cleaning: { icon: Home, color: "#22c55e" },
  HVAC: { icon: Wind, color: "#06b6d4" },
  "Pest Control": { icon: Bug, color: "#ef4444" },
  Electrical: { icon: Zap, color: "#f59e0b" },
  Plumbing: { icon: Wrench, color: "#3b82f6" },
};

export function ServiceCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        const services: Service[] = data.services || [];
        const counts: Record<string, number> = {};

        services.forEach((service) => {
          counts[service.category] =
            (counts[service.category] || 0) + 1;
        });

        const cats: Category[] = Object.entries(counts).map(
          ([name, count]) => {
            const meta =
              categoryMeta[name] || {
                icon: Grid3X3,
                color: "#6366f1",
              };

            return {
              name,
              icon: meta.icon,
              color: meta.color,
              count,
              href: "/customer/services",
            };
          }
        );

        cats.push({
          name: "All Services",
          icon: LayoutGrid,
          color: "#6366f1",
          count: services.length,
          href: "/customer/services",
        });

        setCategories(cats.slice(0, 9));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Browse by Category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find the service you need
          </p>
        </div>

        <Link
          href="/customer/services"
          className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex"
        >
          All services
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <motion.div
              key={category.name}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={category.href}
                className="group flex h-full flex-col items-center rounded-2xl border bg-background p-5 text-center shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div
                  className="mb-3 flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${category.color}15`,
                  }}
                >
                  <Icon
                    className="size-6"
                    style={{ color: category.color }}
                  />
                </div>

                <span className="text-sm font-semibold">
                  {category.name}
                </span>

                <span className="mt-1 text-xs text-muted-foreground">
                  {category.count} services
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}