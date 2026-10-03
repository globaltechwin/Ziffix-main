import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { referenceServices } from "./data/referenceServices";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  const url = new URL(databaseUrl);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  });

  return new PrismaClient({ adapter });
}

const legacyServices = [
  {
    name: "Home Deep Cleaning",
    description:
      "Complete deep cleaning service for your entire home including kitchen, bathroom, and living areas.",
    category: "Cleaning",
    basePrice: 999,
    duration: 120,
    slug: "home-deep-cleaning",
    image:
      "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=400&fit=crop",
  },
  {
    name: "Sofa Cleaning",
    description:
      "Professional sofa shampooing and stain removal to keep your furniture fresh and clean.",
    category: "Cleaning",
    basePrice: 599,
    duration: 60,
    slug: "sofa-cleaning",
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop",
  },
  {
    name: "Car Wash - Exterior",
    description:
      "Complete exterior car wash with premium soap, wax, and tire shine.",
    category: "Car Wash",
    basePrice: 399,
    duration: 45,
    slug: "car-wash-exterior",
    image:
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop",
  },
  {
    name: "Car Wash - Full Detailing",
    description:
      "Interior and exterior full detailing with ceramic coating protection.",
    category: "Car Wash",
    basePrice: 1499,
    duration: 180,
    slug: "car-wash-full-detailing",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&h=400&fit=crop",
  },
  {
    name: "AC Service & Repair",
    description:
      "AC gas refilling, servicing, and repair by certified technicians.",
    category: "HVAC",
    basePrice: 799,
    duration: 60,
    slug: "ac-service-repair",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
  },
  {
    name: "AC Installation",
    description:
      "New split or window AC installation with proper mounting and gas charging.",
    category: "HVAC",
    basePrice: 1999,
    duration: 120,
    slug: "ac-installation",
    image:
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&h=400&fit=crop",
  },
  {
    name: "Laundry - Wash & Fold",
    description:
      "Convenient wash and fold service with detergent and fabric softener.",
    category: "Laundry",
    basePrice: 299,
    duration: 1440,
    slug: "laundry-wash-fold",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=400&fit=crop",
  },
  {
    name: "Ironing Service",
    description:
      "Professional ironing and pressing for all types of garments.",
    category: "Laundry",
    basePrice: 199,
    duration: 60,
    slug: "ironing-service",
    image:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=400&fit=crop",
  },
  {
    name: "Pest Control - General",
    description:
      "Effective pest control treatment for cockroaches, ants, and mosquitoes.",
    category: "Pest Control",
    basePrice: 899,
    duration: 90,
    slug: "pest-control-general",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop",
  },
  {
    name: "Termite Treatment",
    description:
      "Complete termite protection treatment for your home and furniture.",
    category: "Pest Control",
    basePrice: 2499,
    duration: 180,
    slug: "termite-treatment",
    image:
      "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=600&h=400&fit=crop",
  },
  {
    name: "Electrical Wiring Repair",
    description:
      "Expert electrical wiring repair and maintenance by licensed electricians.",
    category: "Electrical",
    basePrice: 499,
    duration: 60,
    slug: "electrical-wiring-repair",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
  },
  {
    name: "Plumbing - Leak Repair",
    description:
      "Quick and reliable leak detection and pipe repair service.",
    category: "Plumbing",
    basePrice: 399,
    duration: 60,
    slug: "plumbing-leak-repair",
    image:
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
  },
];

const referenceServiceSeeds = referenceServices.map((service) => ({
  name: service.name,
  description: service.description,
  category: service.category,
  basePrice: 0,
  duration: 60,
  slug: service.slug,
  image: service.image,
}));

const services = [...legacyServices, ...referenceServiceSeeds];

async function main() {
  const prisma = createPrismaClient();

  try {
    const phone = "9999999999";
    const password = "admin123";
    const name = "Admin";

    const existing = await prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { phone },
        data: {
          role: "admin",
          name,
        },
      });

      console.log(`Updated existing user ${updated.phone} to admin role`);
    } else {
      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          phone,
          password: hashed,
          name,
          role: "admin",
          updatedAt: new Date(),
        },
      });

      console.log(`Admin created: ${user.phone} / ${password}`);
    }

    let created = 0;
    let preserved = 0;

    for (const service of services) {
      if (!service.slug) continue;

      const existingService = await prisma.service.findUnique({
        where: { slug: service.slug },
      });

      if (existingService) {
        preserved += 1;
        continue;
      }

      await prisma.service.create({
        data: {
          id: randomUUID(),
          ...service,
          updatedAt: new Date(),
        },
      });

      created += 1;
    }

    console.log(
      `Service catalog sync complete. Created: ${created}. Preserved existing: ${preserved}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});