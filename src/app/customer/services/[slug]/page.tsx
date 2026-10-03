"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  ShoppingCart,
  Star,
} from "lucide-react";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomCartBar } from "@/components/customer/home/BottomCartBar";

import { getReferenceService } from "../../../../../prisma/data/referenceServices";

/* =========================================================
   SERVICE VARIANT
========================================================= */

interface ServiceVariant {
  id: string;
  serviceId: string;
  name: string;
  description?: string | null;
  price: number;
  duration?: number | null;
  isActive: boolean;
  sortOrder?: number;
}

/* =========================================================
   SERVICE DETAIL

   IMPORTANT:
   basePrice comes from /api/services because that is the
   same live source used by the customer services listing.
========================================================= */

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  image?: string | null;
  slug?: string;
  isActive: boolean;
  rating?: number;
  totalBookings?: number;

  /*
   * Variants are optional because /api/services may not
   * return them. The detail API may return them.
   */
  variants?: ServiceVariant[];
}

/* =========================================================
   IMAGE MAP
========================================================= */

const serviceImageOverrides: Record<string, string> = {
  "home-cleaning":
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=800&fit=crop",

  "bathroom-cleaning":
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop",

  "kitchen-cleaning":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",

  "sofa-carpet-cleaning":
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop",

  "ac-service-repair":
    "https://media.istockphoto.com/id/1255408064/photo/technician-service-checking-and-repairing-air-conditioner.jpg",

  "mosquito-safety-nets":
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop",

  "curtain-care":
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop",

  "solar-panel-cleaning":
    "https://images.pexels.com/photos/33379364/pexels-photo-33379364.jpeg",

  "fan-cleaning":
    "https://images.pexels.com/photos/39272326/pexels-photo-39272326.png?w=1200&h=800&fit=crop",

  "exhaust-fan-cleaning":
    "https://images.pexels.com/photos/38605137/pexels-photo-38605137.jpeg?w=1200&h=800&fit=crop",

  "home-deep-cleaning":
    "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=1200&h=800&fit=crop",

  "full-home-deep-cleaning":
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop",

  "cleaning-subscriptions":
    "https://images.pexels.com/photos/10573242/pexels-photo-10573242.jpeg?w=1200&h=800&fit=crop",

  "ironing-service":
    "https://images.pexels.com/photos/5202929/pexels-photo-5202929.jpeg?w=1200&h=800&fit=crop",

  "car-wash-exterior":
    "https://images.pexels.com/photos/4870699/pexels-photo-4870699.jpeg?w=1200&h=800&fit=crop",

  "car-wash-full-detailing":
    "https://images.pexels.com/photos/6873015/pexels-photo-6873015.jpeg?w=1200&h=800&fit=crop",

  "laundry-wash-fold":
    "https://images.pexels.com/photos/4959878/pexels-photo-4959878.jpeg?w=1200&h=800&fit=crop",

  "pest-control-general":
    "https://images.pexels.com/photos/4176415/pexels-photo-4176415.jpeg",

  "termite-treatment":
    "https://media.istockphoto.com/id/2198514204/photo/spraying-disinfection-and-decontamination.jpg",
};

/* =========================================================
   CATEGORY IMAGE MAP
========================================================= */

const categoryImageMap: Record<string, string> = {
  "home cleaning": "home-cleaning",
  "bathroom cleaning": "bathroom-cleaning",
  "kitchen cleaning": "kitchen-cleaning",
  "sofa & carpet cleaning": "sofa-carpet-cleaning",

  "ac service & repair": "ac-service-repair",
  hvac: "ac-service-repair",

  "mosquito & safety nets": "mosquito-safety-nets",
  "curtain care": "curtain-care",
  "solar panel cleaning": "solar-panel-cleaning",
  "fan cleaning": "fan-cleaning",
  "exhaust fan cleaning": "exhaust-fan-cleaning",
  "home deep cleaning": "home-deep-cleaning",
  "full home deep cleaning": "full-home-deep-cleaning",
  "cleaning subscriptions": "cleaning-subscriptions",

  "car wash": "car-wash-exterior",
  "car wash full detailing": "car-wash-full-detailing",
  "laundry-wash & fold": "laundry-wash-fold",
};

/* =========================================================
   GET SERVICE IMAGE
========================================================= */

function getServiceImage(service: {
  name: string;
  category: string;
  slug?: string;
  image?: string | null;
}) {
  const slug = service.slug?.trim().toLowerCase();
  const name = service.name.trim().toLowerCase();
  const category = service.category.trim().toLowerCase();

  /* =======================================================
     ALL AC / HVAC SERVICES
  ======================================================= */

  if (
    name.includes("ac installation") ||
    name.includes("ac uninstallation") ||
    name.includes("ac servicing") ||
    name.includes("ac service") ||
    name.includes("ac repair") ||
    name.includes("gas leak") ||
    category === "hvac" ||
    category.includes("ac service")
  ) {
    return serviceImageOverrides["ac-service-repair"];
  }

  /* =======================================================
     EXACT SLUG
  ======================================================= */

  if (slug && serviceImageOverrides[slug]) {
    return serviceImageOverrides[slug];
  }

  /* =======================================================
     CATEGORY
  ======================================================= */

  const mappedSlug = categoryImageMap[category];

  if (mappedSlug && serviceImageOverrides[mappedSlug]) {
    return serviceImageOverrides[mappedSlug];
  }

  /* =======================================================
     DATABASE IMAGE
  ======================================================= */

  return service.image || undefined;
}

/* =========================================================
   PAGE
========================================================= */

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFound] = useState(false);

  /* =======================================================
     LOAD SERVICE

     IMPORTANT:
     1. /api/services = current admin-configured price
     2. /api/customer/services/[slug] = detail/variant data

     We merge both responses.
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadService = async () => {
      try {
        const encodedSlug = encodeURIComponent(slug);

        const [servicesResponse, detailResponse] =
          await Promise.all([
            fetch("/api/services", {
              cache: "no-store",
            }),

            fetch(
              `/api/customer/services/${encodedSlug}`,
              {
                cache: "no-store",
              }
            ),
          ]);

        if (!servicesResponse.ok) {
          throw new Error("Failed to load services");
        }

        const servicesData =
          await servicesResponse.json();

        const allServices = Array.isArray(
          servicesData?.services
        )
          ? servicesData.services
          : [];

        /*
         * MAIN PRICE SOURCE
         *
         * This is the same endpoint used by
         * /customer/services.
         */
        const liveService = allServices.find(
          (entry: ServiceDetail) =>
            entry.slug === slug ||
            entry.id === slug
        );

        /*
         * OPTIONAL DETAIL SOURCE
         *
         * This may contain variants and additional
         * detail information.
         */
        let detailService: Partial<ServiceDetail> = {};

        if (detailResponse.ok) {
          const detailData =
            await detailResponse.json();

          if (detailData?.service) {
            detailService = detailData.service;
          }
        }

        if (!active) {
          return;
        }

        if (!liveService && !detailService.id) {
          setNotFound(true);
          return;
        }

        /*
         * Merge the two responses.
         *
         * IMPORTANT:
         * liveService.basePrice wins over detailService.basePrice.
         *
         * This fixes the problem where the detail endpoint
         * returns basePrice = 0 while the services listing
         * correctly has the admin price.
         */

        const mergedService: ServiceDetail = {
          ...(detailService as ServiceDetail),
          ...(liveService as ServiceDetail),

          id:
            liveService?.id ||
            detailService.id ||
            slug,

          name:
            liveService?.name ||
            detailService.name ||
            "Service",

          description:
            liveService?.description ||
            detailService.description ||
            "",

          category:
            liveService?.category ||
            detailService.category ||
            "",

          basePrice:
            typeof liveService?.basePrice === "number"
              ? liveService.basePrice
              : typeof detailService.basePrice === "number"
                ? detailService.basePrice
                : 0,

          duration:
            typeof liveService?.duration === "number"
              ? liveService.duration
              : typeof detailService.duration ===
                  "number"
                ? detailService.duration
                : 0,

          image:
            liveService?.image ||
            detailService.image ||
            undefined,

          slug:
            liveService?.slug ||
            detailService.slug ||
            slug,

          isActive:
            liveService?.isActive ??
            detailService.isActive ??
            true,

          rating:
            liveService?.rating ??
            detailService.rating ??
            0,

          totalBookings:
            liveService?.totalBookings ??
            detailService.totalBookings ??
            0,

          variants:
            Array.isArray(detailService.variants)
              ? detailService.variants
              : Array.isArray(liveService?.variants)
                ? liveService.variants
                : [],
        };

        setService(mergedService);
      } catch (error) {
        console.error(
          "Failed to load service detail:",
          error
        );

        if (active) {
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadService();

    return () => {
      active = false;
    };
  }, [slug]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (notFoundState || !service) {
    notFound();
  }

  return (
    <ServiceDetailContent service={service} />
  );
}

/* =========================================================
   SERVICE DETAIL CONTENT
========================================================= */

function ServiceDetailContent({
  service,
}: {
  service: ServiceDetail;
}) {
  const { addItem } = useCart();

  const reference = service.slug
    ? getReferenceService(service.slug)
    : undefined;

  /* =======================================================
     INCLUDED SERVICES
  ======================================================= */

  const includedBySlug: Record<string, string[]> = {
    "home-cleaning": [
      "Floor wiping + mopping",
      "Dusting",
      "Cabinet cleaning",
      "Bathroom floor scrubbing",
      "Toilet seat & fixtures",
      "Washbasin & fixtures",
      "Table, chair / slab cleaning",
      "Sink & below cleaning",
      "Kitchen appliances (chimney, gas stove)",
      "AC cleaning",
      "Windows & mirrors",
      "Switches & fixtures",
      "Wiping & shining furniture",
      "Mirror cleaning",
      "Sofa & mattress dry vacuuming",
    ],

    "bathroom-cleaning": [
      "Bathroom floor cleaning",
      "Toilet seat and fixture cleaning",
      "Washbasin cleaning",
      "Tap and fittings cleaning",
      "Shower area cleaning",
      "Mirror cleaning",
      "Bathroom surface scrubbing",
      "Removal of common dirt and stains",
    ],

    "kitchen-cleaning": [
      "Kitchen floor cleaning",
      "Kitchen platform cleaning",
      "Sink cleaning",
      "Chimney exterior cleaning",
      "Gas stove cleaning",
      "Cabinet exterior cleaning",
      "Wall and tile surface cleaning",
      "Kitchen appliance surface cleaning",
    ],

    "sofa-carpet-cleaning": [
      "Sofa surface vacuuming",
      "Dry vacuuming",
      "Cushion cleaning",
      "Carpet dust removal",
      "Mattress vacuuming where selected",
      "Surface stain treatment where applicable",
      "Professional cleaning equipment",
    ],

    "ac-service-repair": [
      "AC unit inspection",
      "Filter cleaning",
      "Indoor unit cleaning",
      "Outdoor unit inspection",
      "Basic AC performance check",
      "Service report / technician assessment",
    ],

    "mosquito-safety-nets": [
      "Site measurement",
      "Net or mesh selection",
      "Custom fitting",
      "Frame / fixing installation where applicable",
      "Edge finishing",
      "Installation inspection",
    ],

    "curtain-care": [
      "Curtain measurement",
      "Curtain cleaning according to selected option",
      "Dust removal",
      "Surface cleaning",
      "Careful handling of curtain fabric",
      "Final inspection",
    ],

    "solar-panel-cleaning": [
      "Solar panel surface inspection",
      "Dust removal",
      "Panel surface cleaning",
      "Cleaning around panel edges",
      "Final visual inspection",
    ],

    "fan-cleaning": [
      "Fan blade cleaning",
      "Fan body cleaning",
      "Dust removal",
      "Basic inspection",
      "Final cleaning check",
    ],

    "exhaust-fan-cleaning": [
      "Exhaust fan surface cleaning",
      "Blade cleaning",
      "Dust and grease removal",
      "Cover cleaning",
      "Basic inspection",
      "Final cleaning check",
    ],

    "home-deep-cleaning": [
      "Floor cleaning",
      "Dusting of accessible surfaces",
      "Kitchen cleaning",
      "Bathroom cleaning",
      "Window and mirror cleaning",
      "Furniture surface cleaning",
      "Vacuuming",
      "Final inspection",
    ],

    "full-home-deep-cleaning": [
      "Complete home floor cleaning",
      "Dusting and surface cleaning",
      "Kitchen cleaning",
      "Bathroom cleaning",
      "Window and mirror cleaning",
      "Furniture cleaning",
      "Sofa and mattress vacuuming where applicable",
      "Final inspection",
    ],

    "cleaning-subscriptions": [
      "Scheduled home cleaning visits",
      "Routine floor cleaning",
      "Dusting",
      "Bathroom cleaning",
      "Kitchen cleaning",
      "Regular maintenance cleaning",
      "Service scheduling according to subscription",
    ],
  };

  const includedItems =
    (service.slug &&
      includedBySlug[service.slug]) ||
    reference?.included ||
    [
      "Professional service inspection",
      "Service preparation",
      "Professional cleaning / service work",
      "Final quality check",
    ];

  /* =======================================================
     VARIANTS
  ======================================================= */

  const variants = (service.variants ?? [])
    .filter((variant) => variant.isActive)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) -
        (b.sortOrder ?? 0)
    );

  const hasVariants = variants.length > 0;

  /* =======================================================
     PRICE LOGIC

     RULE:

     1. If variant has a positive price, use it.
     2. If variant price is 0, use admin service basePrice.
     3. If no variants, use service basePrice.
  ======================================================= */

  const getVariantPrice = (
    variant: ServiceVariant
  ) => {
    if (
      typeof variant.price === "number" &&
      variant.price > 0
    ) {
      return variant.price;
    }

    return service.basePrice;
  };

  const variantPrices = variants
    .map(getVariantPrice)
    .filter((price) => price > 0);

  const lowestVariantPrice =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : service.basePrice;

  const hasPrice =
    service.basePrice > 0 ||
    variantPrices.length > 0;

  /* =======================================================
     IMAGE
  ======================================================= */

  const serviceImage = getServiceImage({
    name: service.name,
    category: service.category,
    slug: service.slug,
    image:
      service.image ||
      reference?.image,
  });

  /* =======================================================
     ADD VARIANT TO CART
  ======================================================= */

  const addVariantToCart = (
    variant: ServiceVariant
  ) => {
    const price = getVariantPrice(variant);

    addItem(
      {
        id: variant.id,

        serviceId: service.id,

        variantId: variant.id,

        variantName: variant.name,

        name: variant.name,

        price,

        originalPrice: price,

        duration:
          variant.duration != null
            ? `${variant.duration} min`
            : service.duration != null
              ? `${service.duration} min`
              : "N/A",

        image: serviceImage,

        description:
          variant.description ??
          service.description,
      },

      service.name
    );
  };

  /* =======================================================
     ADD MAIN SERVICE
  ======================================================= */

  const addServiceToCart = () => {
    /*
     * Do not allow a zero-price item into cart.
     */
    if (service.basePrice <= 0) {
      return;
    }

    addItem(
      {
        id: service.id,

        serviceId: service.id,

        variantName: service.name,

        name: service.name,

        price: service.basePrice,

        originalPrice:
          service.basePrice,

        duration:
          service.duration != null
            ? `${service.duration} min`
            : "N/A",

        image: serviceImage,

        description:
          service.description,
      },

      service.name
    );
  };

  /* =======================================================
     PAGE UI
  ======================================================= */

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* =================================================
            HERO
        ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">

          <div className="h-64 sm:h-80">
            {serviceImage ? (
              <img
                src={serviceImage}
                alt={service.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">

            {reference && (
              <Badge className="mb-3 border-0 bg-white/90 text-slate-900 hover:bg-white">
                Phase 1 catalog
              </Badge>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {service.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/85">

              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />

                {service.rating &&
                service.rating > 0
                  ? service.rating
                  : "New"}
              </span>

              {(service.totalBookings ?? 0) >
                0 && (
                <span>
                  {service.totalBookings}+
                  bookings
                </span>
              )}

              <span>
                {service.category}
              </span>

            </div>
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">

          <main className="space-y-6">

            {/* =================================================
                ABOUT
            ================================================= */}

            <section className="rounded-2xl border border-border bg-card p-6">

              <h2 className="text-xl font-bold text-foreground">
                About this service
              </h2>

              <p className="mt-2 leading-7 text-muted-foreground">
                {service.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">

                <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
                  <Clock className="size-4" />

                  {service.duration >
                  0
                    ? `${service.duration} min`
                    : "Duration varies"}
                </span>

                <span className="rounded-full bg-muted px-3 py-2">
                  {hasPrice
                    ? `Starting from ₹${lowestVariantPrice}`
                    : "Price on request"}
                </span>

              </div>
            </section>

            {/* =================================================
                DATABASE VARIANTS
            ================================================= */}

            {hasVariants && (
              <section className="rounded-2xl border border-border bg-card p-6">

                <div className="flex items-center gap-2">

                  <PackageCheck className="size-5 text-primary" />

                  <h2 className="text-xl font-bold text-foreground">
                    Select a service option
                  </h2>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the option that matches your requirement.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">

                  {variants.map(
                    (variant) => {
                      const price =
                        getVariantPrice(
                          variant
                        );

                      return (
                        <div
                          key={
                            variant.id
                          }
                          className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/50"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <p className="font-medium text-foreground">
                                {
                                  variant.name
                                }
                              </p>

                              {variant.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    variant.description
                                  }
                                </p>
                              )}
                            </div>

                            <Badge variant="secondary">
                              ₹{price}
                            </Badge>

                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">

                            <div className="text-sm text-muted-foreground">
                              {variant.duration
                                ? `${variant.duration} min`
                                : "Duration varies"}
                            </div>

                            <Button
                              size="sm"
                              disabled={
                                price <=
                                0
                              }
                              onClick={() =>
                                addVariantToCart(
                                  variant
                                )
                              }
                            >
                              <ShoppingCart className="mr-1.5 size-4" />

                              Add
                            </Button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              </section>
            )}

            {/* =================================================
                REFERENCE OPTIONS
            ================================================= */}

            {!hasVariants &&
              reference && (
                <section className="rounded-2xl border border-border bg-card p-6">

                  <div className="flex items-center gap-2">

                    <PackageCheck className="size-5 text-primary" />

                    <h2 className="text-xl font-bold text-foreground">
                      Service options
                    </h2>

                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Options shown below are taken from the supplied Ziffix service material.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {reference.options.map(
                      (option) => (
                        <div
                          key={
                            option.name
                          }
                          className="rounded-xl border border-border bg-background p-4"
                        >

                          <p className="font-medium text-foreground">
                            {
                              option.name
                            }
                          </p>

                          {option.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                option.description
                              }
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">

                            <span className="text-sm font-semibold text-primary">
                              {hasPrice
                                ? `₹${service.basePrice}`
                                : "Price on request"}
                            </span>

                            <Button
                              size="sm"
                              disabled={
                                !hasPrice
                              }
                              onClick={
                                addServiceToCart
                              }
                            >
                              {hasPrice
                                ? "Add +"
                                : "Set price"}
                            </Button>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </section>
              )}

            {/* =================================================
                INCLUDED
            ================================================= */}

            {reference &&
              reference.included &&
              reference.included.length >
                0 && (
                <section className="rounded-2xl border border-border bg-card p-6">

                  <div className="flex items-center gap-2">

                    <CheckCircle2 className="size-5 text-primary" />

                    <h2 className="text-xl font-bold text-foreground">
                      What is included
                    </h2>

                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Included in the selected service.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {includedItems.map(
                      (entry) => (
                        <div
                          key={
                            entry
                          }
                          className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />

                          <span>
                            {entry}
                          </span>
                        </div>
                      )
                    )}

                  </div>

                </section>
              )}

          </main>

          {/* =================================================
              PRICE SIDEBAR
          ================================================= */}

          <aside className="lg:sticky lg:top-20 lg:self-start">

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">

              <p className="text-sm text-muted-foreground">
                Service price
              </p>

              <p className="mt-1 text-3xl font-bold text-primary">

                {hasPrice
                  ? `₹${lowestVariantPrice}`
                  : "On request"}

              </p>

              <p className="mt-1 text-xs text-muted-foreground">

                {hasVariants
                  ? "Starting price. Select a service option to add it to your cart."
                  : "Price is based on the service price configured by the admin."}

              </p>

              {!hasVariants &&
                hasPrice && (
                  <Button
                    className="mt-5 w-full"
                    onClick={
                      addServiceToCart
                    }
                  >
                    <ShoppingCart className="mr-2 size-4" />

                    Add to Cart
                  </Button>
                )}

              <Link
                href="/customer/services"
                className="mt-3 block"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ArrowLeft className="size-4" />

                  Browse More Services
                </Button>
              </Link>

            </div>

          </aside>

        </div>
      </div>

      <BottomCartBar />
    </div>
  );
}
