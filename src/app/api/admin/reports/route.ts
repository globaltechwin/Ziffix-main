import { NextRequest, NextResponse } from "next/server";
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

async function isAdmin(request: NextRequest): Promise<boolean> {
  const userId = getSessionUserId(request.cookies.get("session")?.value);
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "admin";
}

function monthStart(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentMonthStart = monthStart(now, 0);
    const nextMonthStart = monthStart(now, 1);
    const trendStart = monthStart(now, -6);

    const [
      totalBookings,
      totalRevenueResult,
      newCustomers,
      ratingResult,
      completedBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: "completed" },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({
        where: {
          role: "customer",
          createdAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
      }),
      prisma.technicianprofile.aggregate({
        _avg: { rating: true },
      }),
      prisma.booking.findMany({
        where: {
          status: "completed",
        },
        select: {
          createdAt: true,
          totalAmount: true,
          service: { select: { id: true, name: true } },
          user_booking_technicianIdTouser: {
            select: {
              id: true,
              name: true,
              phone: true,
              technicianprofile: { select: { rating: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const revenueTrend = Array.from({ length: 7 }, (_, index) => {
      const start = monthStart(now, index - 6);
      const end = monthStart(now, index - 5);
      const value = completedBookings
        .filter((booking) => booking.createdAt >= start && booking.createdAt < end)
        .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

      return { month: monthLabel(start), value: Math.round(value) };
    });

    const serviceMap = new Map<string, { name: string; bookings: number; revenue: number }>();
    const technicianMap = new Map<string, { name: string; jobs: number; earnings: number; rating: number }>();

    for (const booking of completedBookings) {
      const serviceId = booking.service?.id;
      if (serviceId) {
        const current = serviceMap.get(serviceId) ?? {
          name: booking.service?.name || "Service",
          bookings: 0,
          revenue: 0,
        };
        current.bookings += 1;
        current.revenue += Number(booking.totalAmount || 0);
        serviceMap.set(serviceId, current);
      }

      const technicianId = booking.user_booking_technicianIdTouser?.id;
      if (technicianId) {
        const current = technicianMap.get(technicianId) ?? {
          name:
            booking.user_booking_technicianIdTouser?.name ||
            booking.user_booking_technicianIdTouser?.phone ||
            "Technician",
          jobs: 0,
          earnings: 0,
          rating: Number(booking.user_booking_technicianIdTouser?.technicianprofile?.rating || 0),
        };
        current.jobs += 1;
        current.earnings += Number(booking.totalAmount || 0);
        technicianMap.set(technicianId, current);
      }
    }

    const topServices = [...serviceMap.values()]
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({ ...item, revenue: Math.round(item.revenue) }));

    const topTechnicians = [...technicianMap.values()]
      .sort((a, b) => b.jobs - a.jobs || b.earnings - a.earnings)
      .slice(0, 5)
      .map((item) => ({ ...item, earnings: Math.round(item.earnings), rating: Number(item.rating.toFixed(1)) }));

    return NextResponse.json({
      stats: {
        totalRevenue: Math.round(Number(totalRevenueResult._sum.totalAmount || 0)),
        totalBookings,
        newCustomers,
        avgRating: Number((ratingResult._avg.rating || 0).toFixed(1)),
      },
      monthlyRevenue: revenueTrend,
      topServices,
      topTechnicians,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json({ error: "Failed to load live reports" }, { status: 500 });
  }
}
