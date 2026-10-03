import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTechnician, unauthorized } from "@/lib/technician-auth";

const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};

export async function GET(request: NextRequest) {
  try {
    const technician = await getTechnician(request);

    if (!technician) {
      return unauthorized();
    }

    const bookings = await prisma.booking.findMany({
      where: {
        technicianId: technician.id,
      },
      include: {
        user_booking_customerIdTouser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: "desc" },
        { scheduledTime: "asc" },
      ],
    });

    return NextResponse.json({
      jobs: bookings.map((booking) => ({
        id: booking.id,
        serviceName: booking.service.name,
        serviceType: booking.service.category,
        customerName:
          booking.user_booking_customerIdTouser.name || "Customer",
        customerPhone: booking.user_booking_customerIdTouser.phone,
        customerEmail: booking.user_booking_customerIdTouser.email,
        status: booking.status,
        scheduledDate: booking.scheduledDate.toISOString(),
        scheduledTime: booking.scheduledTime,
        address: booking.address,
        amount: booking.totalAmount,
        notes: booking.notes,
      })),
    });
  } catch (error) {
    console.error("Technician jobs error:", error);

    return NextResponse.json(
      { error: "Failed to load jobs" },
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
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "bookingId and status are required" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        technicianId: technician.id,
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        totalAmount: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    const allowedNext = transitions[booking.status] || [];

    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot change ${booking.status} to ${status}`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status,
          ...(status === "cancelled"
            ? { technicianId: null }
            : {}),
          updatedAt: new Date(),
        },
      });

      if (status === "completed") {
        await tx.technicianprofile.update({
          where: {
            userId: technician.id,
          },
          data: {
            totalJobs: {
              increment: 1,
            },
            updatedAt: new Date(),
          },
        });
      }

      await tx.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: booking.customerId,
          title:
            status === "completed"
              ? "Service Completed"
              : "Booking Updated",
          message: `${booking.service.name} booking ${booking.id} is now ${status.replaceAll("_", " ")}.`,
          type: "booking",
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error) {
    console.error("Technician job update error:", error);

    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 },
    );
  }
}