import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTechnician, unauthorized } from "@/lib/technician-auth";

export async function GET(request: NextRequest) {
  try {
    const technician = await getTechnician(request);
    if (!technician) return unauthorized();

    const bookings = await prisma.booking.findMany({
      where: { technicianId: technician.id, status: "completed" },
      include: { service: { select: { name: true } }, user_booking_customerIdTouser: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const paidStatuses = new Set(["paid", "verified", "completed"]);
    const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const paid = bookings.filter((b) => paidStatuses.has(b.paymentStatus.toLowerCase())).reduce((sum, b) => sum + b.totalAmount, 0);
    const pending = total - paid;
    const monthKey = new Date().toISOString().slice(0, 7);
    const thisMonth = bookings.filter((b) => b.updatedAt.toISOString().slice(0, 7) === monthKey).reduce((sum, b) => sum + b.totalAmount, 0);

    const monthlyMap = new Map<string, number>();
    for (const booking of bookings) {
      const key = booking.updatedAt.toLocaleString("en-IN", { month: "short", year: "numeric" });
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + booking.totalAmount);
    }

    return NextResponse.json({
      stats: {
        totalEarned: paid,
        completedValue: total,
        thisMonth,
        pendingPayout: pending,
        avgPerJob: bookings.length ? Math.round(total / bookings.length) : 0,
      },
      monthly: Array.from(monthlyMap.entries()).reverse().slice(0, 12).map(([month, value]) => ({ month, value })),
      earnings: bookings.map((booking) => ({
        id: booking.id,
        jobId: booking.id,
        serviceName: booking.service.name,
        customerName: booking.user_booking_customerIdTouser.name || "Customer",
        date: booking.updatedAt.toISOString(),
        status: paidStatuses.has(booking.paymentStatus.toLowerCase()) ? "paid" : "pending",
        amount: booking.totalAmount,
      })),
    });
  } catch (error) {
    console.error("Technician earnings error:", error);
    return NextResponse.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
