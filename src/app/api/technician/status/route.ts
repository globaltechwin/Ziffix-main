import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTechnician, unauthorized } from "@/lib/technician-auth";

const allowed = new Set(["available", "busy", "offline"]);

export async function PATCH(request: NextRequest) {
  try {
    const technician = await getTechnician(request);

    if (!technician) {
      return unauthorized();
    }

    const body = await request.json();
    const { status } = body;

    if (!allowed.has(status)) {
      return NextResponse.json(
        { error: "Invalid technician status" },
        { status: 400 },
      );
    }

    const profile = await prisma.technicianprofile.update({
      where: {
        userId: technician.id,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status: profile.status,
    });
  } catch (error) {
    console.error("Technician status update error:", error);

    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}