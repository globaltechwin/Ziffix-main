/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaMariaDb(connectionString);

const prisma = new PrismaClient({
  adapter,
});

const variants = {
  "ac-service-repair": [
    "Window AC Servicing",
    "Split AC Servicing",
    "Window AC Uninstallation",
    "Window AC Installation",
    "Split AC Uninstallation",
    "Split AC Installation",
    "AC Repair (Window/Split)",
    "Gas Leak Fixing and Refill (Window/Split)",
  ],

  "bathroom-cleaning": [
    "Classic Bathroom Cleaning",
    "Intense Bathroom Cleaning",
  ],

  "kitchen-cleaning": [
    "Kitchen Cleaning",
    "With Appliance & Chimney",
  ],

  "sofa-carpet-cleaning": [
    "3 Sofa Seats + 3 Cushions",
    "4 Sofa Seats + 4 Cushions",
    "5 Sofa Seats + 5 Cushions",
    "6 Sofa Seats + 6 Cushions",
    "Mattress Cleaning - Single Bed",
    "Mattress Cleaning - Double Bed",
    "Carpet Cleaning - Large",
    "Carpet Cleaning - Extra Large",
  ],

  "mosquito-safety-nets": [
    "Nylon Bird Net",
    "Balcony Safety Net Installation",
    "Roller Mosquito Mesh",
    "Pleated Mosquito Mesh",
    "Magnetic Mosquito Mesh",
    "Door Mosquito Mesh",
    "Aluminium Door Mosquito Mesh",
    "Sliding Door Mosquito Mesh",
  ],

  "curtain-care": [
    "Blind Curtain - Medium (Upto 30 Sqft)",
    "Curtain - Medium (Upto 30 Sqft)",
    "Blind Curtain - Big (Upto 40 Sqft)",
    "Curtain - Big (Upto 40 Sqft)",
    "Blind Curtain - XL (Upto 70 Sqft)",
    "Curtain - XL (Upto 70 Sqft)",
    "Blind Curtain - XXL (Upto 100 Sqft)",
    "Blind Curtain - XXXL (Upto 140 Sqft)",
    "Curtain - XXL (Upto 100 Sqft)",
    "Curtain - XXXL (Upto 140 Sqft)",
  ],

  "solar-panel-cleaning": [
    "Single Row - 3 Meter",
    "Double Row - 4 Meter",
    "Single Row - 4 Meter",
  ],

  "home-deep-cleaning": [
    "Home Deep Cleaning",
  ],

  "full-home-deep-cleaning": [
    "Premium Furnished Home/Flat",
    "1 BHK Furnished Flat",
    "2 BHK Furnished Flat",
    "3 BHK Furnished Flat",
    "4 BHK Furnished Flat",
  ],

  "cleaning-subscriptions": [
    "Home Cleaning - 1 Visit/Month",
    "Home Cleaning - 2 Visits/Month",
    "Home Cleaning - 3 Months",
    "Home Cleaning - 6 Months",
    "Home Cleaning - 12 Months",
  ],

  "fan-cleaning": [
    "Ceiling Fan Cleaning",
  ],

  "exhaust-fan-cleaning": [
    "Exhaust Fan Cleaning",
  ],
};

async function main() {
  console.log("Starting safe service variant seed...\n");

  let created = 0;
  let skipped = 0;
  let missing = 0;

  for (const [slug, names] of Object.entries(variants)) {
    const service = await prisma.service.findUnique({
      where: {
        slug,
      },
    });

    if (!service) {
      console.log(`⚠ Service not found: ${slug}`);
      missing += 1;
      continue;
    }

    console.log(`\nService: ${service.name}`);

    for (let index = 0; index < names.length; index += 1) {
      const name = names[index];

      const existing =
        await prisma.serviceVariant.findFirst({
          where: {
            serviceId: service.id,
            name,
          },
        });

      if (existing) {
        console.log(`  ↳ Already exists: ${name}`);
        skipped += 1;
        continue;
      }

      await prisma.serviceVariant.create({
        data: {
          serviceId: service.id,
          name,
          price: service.basePrice,
          duration: service.duration || null,
          isActive: true,
          sortOrder: index,
        },
      });

      console.log(`  ✓ Created: ${name}`);
      created += 1;
    }
  }

  console.log("\n--------------------------------");
  console.log("Service variant seed completed");
  console.log(`Created : ${created}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Missing : ${missing}`);
  console.log("--------------------------------");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });