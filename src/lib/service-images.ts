// src/lib/service-images.ts
// Single source of truth for service images used across Ziffix.

export const SERVICE_IMAGES: Record<string, string> = {
  "ac-installation":
    "https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ac-service-repair":
    "https://media.istockphoto.com/id/1255408064/photo/technician-service-checking-and-repairing-air-conditioner.jpg?",
  "ac-repair":
    "https://images.pexels.com/photos/4246265/pexels-photo-4246265.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ac-servicing":
    "https://images.pexels.com/photos/4246265/pexels-photo-4246265.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ac-uninstallation":
    "https://images.pexels.com/photos/4246265/pexels-photo-4246265.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "gas-leak-fixing-refill":
    "https://images.pexels.com/photos/4246265/pexels-photo-4246265.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "hvac":
    "https://images.pexels.com/photos/4246265/pexels-photo-4246265.jpeg?auto=compress&cs=tinysrgb&w=1200",

  "bathroom-cleaning":
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&h=600&fit=crop",
  "car-wash-exterior":
    "https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "car-wash-full-detailing":
    "https://images.pexels.com/photos/6873015/pexels-photo-6873015.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "car-wash-interior-cleaning":
    "https://images.pexels.com/photos/4489721/pexels-photo-4489721.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "cleaning-subscriptions":
    "https://images.pexels.com/photos/10573242/pexels-photo-10573242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "curtain-care":
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=compress&cs=tinysrgb&w=1200",
  "electrical-wiring-repair":
    "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "exhaust-fan-cleaning":
    "https://images.pexels.com/photos/38605137/pexels-photo-38605137.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "fan-cleaning":
    "https://images.pexels.com/photos/39272326/pexels-photo-39272326.png?auto=compress&cs=tinysrgb&w=1200",
  "full-home-deep-cleaning":
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=compress&cs=tinysrgb&w=1200",
  "home-cleaning":
    "https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "kitchen-cleaning":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=compress&cs=tinysrgb&w=1200",
  "laundry":
    "https://images.pexels.com/photos/4959878/pexels-photo-4959878.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "sofa-cleaning":
    "https://images.pexels.com/photos/4108718/pexels-photo-4108718.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "water-tank-cleaning":
    "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "water-purifier-service":
    "https://images.pexels.com/photos/8764564/pexels-photo-8764564.jpeg?auto=compress&cs=tinysrgb&w=1200",

  // Existing catalog aliases.
  "home-deep-cleaning":
    "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=compress&cs=tinysrgb&w=1200",
  "sofa-carpet-cleaning":
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=compress&cs=tinysrgb&w=1200",
  "laundry-wash-fold":
    "https://images.pexels.com/photos/4959878/pexels-photo-4959878.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "pest-control-general":
    "https://images.pexels.com/photos/4176415/pexels-photo-4176415.jpeg",
  "ironing-service":
      "https://images.pexels.com/photos/5202929/pexels-photo-5202929.jpeg?w=900&h=600&fit=crop",
  "solar-panel-cleaning":
      "https://images.pexels.com/photos/33379364/pexels-photo-33379364.jpeg",
  "termite-treatment":
      "https://media.istockphoto.com/id/2198514204/photo/spraying-disinfection-and-decontamination.jpg?",



};

const CATEGORY_TO_SLUG: Record<string, string> = {
  "home cleaning": "home-cleaning",
  "bathroom cleaning": "bathroom-cleaning",
  "kitchen cleaning": "kitchen-cleaning",
  "sofa & carpet cleaning": "sofa-cleaning",
  "ac service & repair": "ac-service-repair",
  hvac: "ac-service-repair",
  "fan cleaning": "fan-cleaning",
  "exhaust fan cleaning": "exhaust-fan-cleaning",
  "home deep cleaning": "full-home-deep-cleaning",
  "full home deep cleaning": "full-home-deep-cleaning",
  "cleaning subscriptions": "cleaning-subscriptions",
  "curtain care": "curtain-care",
  "car wash": "car-wash-exterior",
  "car wash full detailing": "car-wash-full-detailing",
  "electrical": "electrical-wiring-repair",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");


export function createServiceSlug(service: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}): string | undefined {
  const databaseSlug = service.slug?.trim();

  if (databaseSlug) {
    return databaseSlug;
  }

  const databaseId = service.id?.trim();

  if (databaseId) {
    return databaseId;
  }

  const name = service.name?.trim();

  if (!name) {
    return undefined;
  }

  const generatedSlug = slugify(name);
  return generatedSlug || undefined;
}

export function getServiceImage(service: {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  slug?: string | null;
  image?: string | null;
}): string | undefined {
  const slug = slugify(service.slug || "");
  const id = slugify(service.id || "");
  const name = (service.name || "").trim().toLowerCase();
  const category = (service.category || "").trim().toLowerCase();

  // All AC-related services use the same canonical AC service image.
  if (
    name.includes("ac installation") ||
    name.includes("ac uninstallation") ||
    name.includes("ac servicing") ||
    name.includes("ac service") ||
    name.includes("ac repair") ||
    name.includes("gas leak") ||
    category === "hvac"
  ) {
    return SERVICE_IMAGES["ac-service-repair"];
  }

  for (const key of [slug, id]) {
    if (key && SERVICE_IMAGES[key]) {
      return SERVICE_IMAGES[key];
    }
  }

  const generated = slugify(service.name || "");
  if (generated && SERVICE_IMAGES[generated]) {
    return SERVICE_IMAGES[generated];
  }

  const categorySlug = CATEGORY_TO_SLUG[category];
  if (categorySlug && SERVICE_IMAGES[categorySlug]) {
    return SERVICE_IMAGES[categorySlug];
  }

  return service.image || undefined;
}
