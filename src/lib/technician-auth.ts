import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getTechnician(request: NextRequest) {
  const cookie = request.cookies.get("session")?.value;
  if (!cookie) return null;

  try {
    const session = JSON.parse(atob(cookie));
    if (!session.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        technicianprofile: {
          select: {
            id: true,
            specialties: true,
            certifications: true,
            rating: true,
            totalJobs: true,
            status: true,
          },
        },
      },
    });

    if (!user || user.role !== "technician" || !user.technicianprofile) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function splitList(value: string | null | undefined) {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}
