import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function splitList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function startOfToday(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfToday(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let session: { userId?: string };
    try {
      session = JSON.parse(atob(sessionCookie)) as { userId?: string };
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!session.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const technician = await prisma.user.findUnique({
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

    if (!technician || technician.role !== "technician") {
      return NextResponse.json({ error: "Technician account not found" }, { status: 404 });
    }

    const profile = technician.technicianprofile;

    // A technician user can exist without a profile if the profile creation
    // failed or the account was imported manually. Do not dereference null.
    if (!profile) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const today = new Date();
    const todayStart = startOfToday(today);
    const todayEnd = endOfToday(today);

    const [todayJobs, completedJobs] = await Promise.all([
      prisma.booking.findMany({
        where: {
          technicianId: technician.id,
          scheduledDate: { gte: todayStart, lte: todayEnd },
          status: { notIn: ["completed", "cancelled"] },
        },
        select: {
          id: true,
          status: true,
          scheduledDate: true,
          scheduledTime: true,
          address: true,
          notes: true,
          totalAmount: true,
          service: {
            select: {
              name: true,
              category: true,
            },
          },
          user_booking_customerIdTouser: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
      }),
      prisma.booking.findMany({
        where: {
          technicianId: technician.id,
          status: "completed",
        },
        select: {
          id: true,
          status: true,
          scheduledDate: true,
          scheduledTime: true,
          totalAmount: true,
          service: { select: { name: true, category: true } },
          user_booking_customerIdTouser: {
            select: { name: true, phone: true },
          },
        },
        orderBy: { scheduledDate: "desc" },
        take: 5,
      }),
    ]);

    const allCompleted = await prisma.booking.findMany({
      where: { technicianId: technician.id, status: "completed" },
      select: { totalAmount: true, paymentStatus: true },
    });

    const completedCount = allCompleted.length;
    const completedValue = allCompleted.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const paidCompletedValue = allCompleted
      .filter((booking) => ["paid", "verified", "completed"].includes(booking.paymentStatus.toLowerCase()))
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return NextResponse.json({
      technician: {
        id: technician.id,
        name: technician.name || "Technician",
        phone: technician.phone,
        email: technician.email,
        specialties: splitList(profile.specialties),
        certifications: splitList(profile.certifications),
        rating: profile.rating,
        totalJobs: profile.totalJobs,
        status: profile.status,
      },
      stats: {
        todayJobs: todayJobs.length,
        completedJobs: completedCount,
        totalEarned: paidCompletedValue,
        completedValue,
      },
      todayJobs: todayJobs.map((booking) => ({
        id: booking.id,
        serviceName: booking.service.name,
        serviceType: booking.service.category,
        customerName: booking.user_booking_customerIdTouser.name || "Customer",
        customerPhone: booking.user_booking_customerIdTouser.phone,
        scheduledDate: booking.scheduledDate.toISOString(),
        scheduledTime: booking.scheduledTime,
        address: booking.address,
        notes: booking.notes,
        amount: booking.totalAmount,
        status: booking.status,
      })),
      recentCompleted: completedJobs.map((booking) => ({
        id: booking.id,
        serviceName: booking.service.name,
        customerName: booking.user_booking_customerIdTouser.name || "Customer",
        date: booking.scheduledDate.toISOString(),
        amount: booking.totalAmount,
        status: booking.status,
      })),
    });
  } catch (error) {
    console.error("Technician dashboard error:", error);
    return NextResponse.json({ error: "Failed to load technician dashboard" }, { status: 500 });
  }
}
