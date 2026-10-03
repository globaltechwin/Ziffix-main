import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

function getAdminFromSession(session: string): string | null {
  try {
    const decoded = JSON.parse(atob(session));

    if (decoded.role !== "admin") {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

function isAdmin(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("session")?.value;

  return sessionCookie
    ? getAdminFromSession(sessionCookie)
    : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const services =
      await prisma.service.findMany({
        orderBy: [
          { category: "asc" },
          { name: "asc" },
        ],
      });

    return NextResponse.json({ services });
  } catch (error) {
    console.error(
      "List services error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to list services" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(
      body.description || "",
    ).trim();

    const category = String(
      body.category || "",
    ).trim();

    const basePrice = Number(body.basePrice);
    const duration = Number(body.duration);

    const image = body.image
      ? String(body.image).trim()
      : null;

    const requestedSlug = body.slug
      ? String(body.slug).trim()
      : "";

    const slug =
      requestedSlug || slugify(name);

    if (
      !name ||
      !description ||
      !category ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0 ||
      !Number.isFinite(duration)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid service fields. Price must be greater than ₹0.",
        },
        { status: 400 },
      );
    }

    const existing =
      await prisma.service.findUnique({
        where: { slug },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Service with this slug already exists",
        },
        { status: 409 },
      );
    }

    const service =
      await prisma.service.create({
        data: {
          id: randomUUID(),
          name,
          description,
          category,
          basePrice: Math.max(
            1,
            Math.round(basePrice),
          ),
          duration: Math.max(
            0,
            Math.round(duration),
          ),
          image,
          slug,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json(
      { service },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create service error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const serviceId = String(
      body.serviceId || "",
    );

    const name = String(
      body.name || "",
    ).trim();

    const description = String(
      body.description || "",
    ).trim();

    const category = String(
      body.category || "",
    ).trim();

    const basePrice = Number(body.basePrice);
    const duration = Number(body.duration);

    const image = body.image
      ? String(body.image).trim()
      : null;

    if (
      !serviceId ||
      !name ||
      !description ||
      !category ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0 ||
      !Number.isFinite(duration)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid service fields. Price must be greater than ₹0.",
        },
        { status: 400 },
      );
    }

    const service =
      await prisma.service.update({
        where: {
          id: serviceId,
        },

        data: {
          name,
          description,
          category,
          basePrice: Math.max(
            1,
            Math.round(basePrice),
          ),
          duration: Math.max(
            0,
            Math.round(duration),
          ),
          image,
        },
      });

    return NextResponse.json({
      service,
    });
  } catch (error) {
    console.error(
      "Update service error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const serviceId = String(
      body.serviceId || "",
    );

    /*
     * Price update
     */
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "basePrice",
      )
    ) {
      const basePrice = Number(
        body.basePrice,
      );

      if (
        !serviceId ||
        !Number.isFinite(basePrice) ||
        basePrice <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "serviceId and a price greater than ₹0 are required",
          },
          { status: 400 },
        );
      }

      const service =
        await prisma.service.update({
          where: {
            id: serviceId,
          },

          data: {
            basePrice: Math.max(
              1,
              Math.round(basePrice),
            ),
          },
        });

      return NextResponse.json({
        service,
      });
    }

    /*
     * Active / inactive update
     */
    const isActive = body.isActive;

    if (
      !serviceId ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "serviceId and isActive (boolean) required",
        },
        { status: 400 },
      );
    }

    const service =
      await prisma.service.update({
        where: {
          id: serviceId,
        },

        data: {
          isActive,
        },
      });

    return NextResponse.json({
      service,
    });
  } catch (error) {
    console.error(
      "Service PATCH error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update service",
      },
      { status: 500 },
    );
  }
}
