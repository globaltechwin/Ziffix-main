import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTechnician, unauthorized } from "@/lib/technician-auth";

export async function GET(request: NextRequest) {
  try {
    const technician = await getTechnician(request);

    if (!technician) {
      return unauthorized();
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: technician.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      notifications,
    });
  } catch (error) {
    console.error("Technician notifications GET error:", error);

    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const technician = await getTechnician(request);

    if (!technician) {
      return unauthorized();
    }

    const body = await request.json();

    if (body.all === true) {
      await prisma.notification.updateMany({
        where: {
          userId: technician.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: {
          id: body.id,
          userId: technician.id,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Notification id or all is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Technician notifications PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}