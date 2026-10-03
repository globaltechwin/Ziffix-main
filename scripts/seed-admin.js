
/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");


const bcrypt = require("bcryptjs");

async function main() {
  const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
  const { PrismaClient } = require("@prisma/client");

  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  });

  const prisma = new PrismaClient({ adapter });

  const phone = "9677192579";
  const newPassword = "admin123";

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing) {
    console.log("Admin not found. Creating...");
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.create({
      data: { phone, password: hashed, name: "Admin", role: "admin" },
    });
  } else {
    console.log(`Found user: ${existing.phone}, role: ${existing.role}`);
    console.log(`Old hash prefix: ${existing.password.substring(0, 7)}`);
    const hashed = await bcrypt.hash(newPassword, 10);
    console.log(`New hash prefix: ${hashed.substring(0, 7)}`);
    await prisma.user.update({
      where: { phone },
      data: { password: hashed, role: "admin" },
    });
  }

  // Verify it works
  const user = await prisma.user.findUnique({ where: { phone } });
  const valid = await bcrypt.compare(newPassword, user.password);
  console.log(`Password verify: ${valid}`);

  // List all users
  const all = await prisma.user.findMany({ select: { phone: true, name: true, role: true } });
  console.log("All users:", JSON.stringify(all, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
