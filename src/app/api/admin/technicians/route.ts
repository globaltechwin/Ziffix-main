import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

function getSessionUserId(session: string | undefined): string | null {
  if (!session) return null;

  try {
    const decoded = JSON.parse(atob(session));
    return decoded?.userId ?? decoded?.id ?? null;
  } catch {
    return null;
  }
}

async function getAdminId(request: NextRequest): Promise<string | null> {
  const userId = getSessionUserId(request.cookies.get("session")?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  return user?.role === "admin" ? user.id : null;
}

function normalizeSpecialties(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function normalizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await getAdminId(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const technicians = await prisma.user.findMany({
      where: { role: "technician" },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        technicianprofile: {
          select: {
            id: true,
            userId: true,
            specialties: true,
            certifications: true,
            rating: true,
            totalJobs: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      technicians: technicians.map((technician) => ({
        id: technician.id,
        phone: technician.phone,
        name: technician.name || "Technician",
        email: technician.email,
        role: technician.role,
        createdAt: technician.createdAt,
        technicianProfile: technician.technicianprofile
          ? {
              id: technician.technicianprofile.id,
              userId: technician.technicianprofile.userId,
              specialties: technician.technicianprofile.specialties
                ? technician.technicianprofile.specialties.split(",").map((item) => item.trim()).filter(Boolean)
                : [],
              certifications: technician.technicianprofile.certifications
                ? technician.technicianprofile.certifications.split(",").map((item) => item.trim()).filter(Boolean)
                : [],
              rating: technician.technicianprofile.rating,
              totalJobs: technician.technicianprofile.totalJobs,
              status: technician.technicianprofile.status,
              createdAt: technician.technicianprofile.createdAt,
              updatedAt: technician.technicianprofile.updatedAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("List technicians error:", error);
    return NextResponse.json({ error: "Failed to load technicians" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getAdminId(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(body.phone);
    const password = String(body.password ?? "");
    const specialties = normalizeSpecialties(body.specialties);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (!specialties) {
      return NextResponse.json({ error: "At least one specialty is required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "Account already exists with this phone number" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const technician = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          password: hashedPassword,
          name,
          role: "technician",
        },
      });

      await tx.technicianprofile.create({
  data: {
    id: randomUUID(),
    userId: user.id,
    specialties,
    status: "offline",
    rating: 0,
    totalJobs: 0,
    updatedAt: new Date(),
  },
});

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          technicianprofile: {
            select: {
              id: true,
              userId: true,
              specialties: true,
              certifications: true,
              rating: true,
              totalJobs: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ technician }, { status: 201 });
  } catch (error) {
    console.error("Create technician error:", error);
    return NextResponse.json({ error: "Failed to create technician" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getAdminId(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = String(body.userId ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const technician = await prisma.user.findFirst({
      where: { id: userId, role: "technician" },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    const data: { name?: string; phone?: string } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      data.name = name;
    }

    if (body.phone !== undefined) {
      const phone = normalizePhone(body.phone);
      if (!/^\d{10}$/.test(phone)) {
        return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json({ error: "Phone number already in use" }, { status: 409 });
      }

      data.phone = phone;
    }

    const specialties =
      body.specialties !== undefined
        ? normalizeSpecialties(body.specialties)
        : undefined;

    if (body.specialties !== undefined && !specialties) {
      return NextResponse.json({ error: "At least one specialty is required" }, { status: 400 });
    }

    const status = body.status !== undefined ? String(body.status) : undefined;
    if (status !== undefined && !["available", "busy", "offline"].includes(status)) {
      return NextResponse.json({ error: "Invalid technician status" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data,
      });

      await tx.technicianprofile.update({
        where: { userId },
        data: {
          ...(specialties !== undefined ? { specialties } : {}),
          ...(status !== undefined ? { status } : {}),
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          technicianprofile: {
            select: {
              id: true,
              userId: true,
              specialties: true,
              certifications: true,
              rating: true,
              totalJobs: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ technician: updated });
  } catch (error) {
    console.error("Update technician error:", error);
    return NextResponse.json({ error: "Failed to update technician" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await getAdminId(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const userId = String(body.userId ?? url.searchParams.get("userId") ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const technician = await prisma.user.findFirst({
      where: { id: userId, role: "technician" },
      select: { id: true, name: true },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Existing bookings are kept; only the technician assignment is removed.
      await tx.booking.updateMany({
        where: { technicianId: userId },
        data: { technicianId: null },
      });

      await tx.notification.deleteMany({ where: { userId } });
      await tx.technicianprofile.delete({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Delete technician error:", error);
    return NextResponse.json({ error: "Failed to delete technician" }, { status: 500 });
  }
}
