import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not defined. Please check C:\\projects\\Ziffix\\.env"
  );
}

const url = new URL(databaseUrl);

const configuredHost = url.hostname || "localhost";

// On Windows, `localhost` can resolve to IPv6 (::1).
// MySQL is confirmed working through IPv4 127.0.0.1,
// so use IPv4 explicitly for local development.
const host =
  configuredHost === "localhost" || configuredHost === "::1"
    ? "127.0.0.1"
    : configuredHost;

const port = Number(url.port || 3306);
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = decodeURIComponent(
  url.pathname.replace(/^\/+/, "")
);

if (!database) {
  throw new Error(
    "DATABASE_URL does not contain a database name."
  );
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  adapter?: PrismaMariaDb;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

const adapter =
  globalForPrisma.adapter ??
  new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,

    // One shared application pool.
    connectionLimit: 5,

    // Connection establishment timeout.
    connectTimeout: 10_000,

    // Maximum time waiting for a pool connection.
    acquireTimeout: 30_000,

    // Keep genuinely idle connections available.
    idleTimeout: 300,
  });

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}

export { prisma };