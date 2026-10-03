import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserIdFromSession(session: string | undefined): string | null {
  if (!session) return null;

  try {
    const decoded = JSON.parse(atob(session));
    return typeof decoded?.userId === "string" ? decoded.userId : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromSession(request.cookies.get("session")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        customerId: userId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            image: true,
            basePrice: true,
            duration: true,
          },
        },
        user_booking_technicianIdTouser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            transactionId: true,
            createdAt: true,
          },
        },
        bookingitem: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                image: true,
              },
            },
            servicevariant: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Failed to fetch customer booking details:", error);
    return NextResponse.json(
      { error: "Failed to load booking details" },
      { status: 500 }
    );
  }
}
