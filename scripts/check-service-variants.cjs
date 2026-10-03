/* eslint-disable @typescript-eslint/no-require-imports */

require("dotenv").config();

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaMariaDb(connectionString);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const services = await prisma.service.findMany({
    include: {
      variants: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log("\n========================================");
  console.log("SERVICES AND VARIANTS");
  console.log("========================================");

  for (const service of services) {
    console.log(`\n=== ${service.name} ===`);
    console.log(`Slug: ${service.slug}`);
    console.log(`Base Price: Rs.${service.basePrice}`);
    console.log(`Variants: ${service.variants.length}`);

    if (service.variants.length === 0) {
      console.log("  NO VARIANTS");
      continue;
    }

    for (const variant of service.variants) {
      console.log(
        `  - ${variant.name} | Rs.${variant.price} | ${
          variant.duration ?? "N/A"
        } min | Active: ${variant.isActive}`
      );
    }
  }

  console.log("\n========================================");
  console.log(`TOTAL SERVICES: ${services.length}`);

  const totalVariants = services.reduce(
    (total, service) => total + service.variants.length,
    0
  );

  console.log(`TOTAL VARIANTS: ${totalVariants}`);
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\nERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });