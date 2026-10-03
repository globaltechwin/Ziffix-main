import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   CUSTOMER SESSION
========================================================= */

function getUserId(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(atob(sessionCookie));

    if (!session?.userId) {
      return null;
    }

    return String(session.userId);
  } catch {
    return null;
  }
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function normalizePaymentStatus(
  paymentStatus: string | null | undefined,
  bookingPaymentStatus: string | null | undefined,
) {
  const status = String(
    paymentStatus || bookingPaymentStatus || "pending",
  ).toLowerCase();

  if (
    status === "paid" ||
    status === "completed" ||
    status === "verified" ||
    status === "success" ||
    status === "successful"
  ) {
    return "paid";
  }

  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "failed";
  }

  return "pending";
}

/* =========================================================
   GET CUSTOMER INVOICES
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * IMPORTANT
     *
     * Invoices are built from BOOKINGS, not only from
     * payment rows.
     *
     * This guarantees that:
     * - every customer booking can appear
     * - the real booking total is used
     * - technician assignment is current
     * - service/variant information comes from the booking
     * - no artificial 18% tax is added
     */

    const bookings = await prisma.booking.findMany({
      where: {
        customerId: userId,
      },

      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            basePrice: true,
            image: true,
          },
        },

        user_booking_technicianIdTouser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,

            technicianprofile: {
              select: {
                specialties: true,
                rating: true,
                status: true,
                certifications: true,
              },
            },
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
          select: {
            id: true,
            serviceId: true,
            serviceName: true,
            variantId: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            duration: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const invoices = bookings.map((booking) => {
      const payment = booking.payment;

      /*
       * THE IMPORTANT FIX:
       *
       * Never calculate:
       *
       * booking/payment amount + 18% tax
       *
       * The booking.totalAmount is the actual amount
       * agreed when the booking was created.
       */

      const totalAmount = Number(booking.totalAmount || 0);

      const paymentStatus = normalizePaymentStatus(
        payment?.status,
        booking.paymentStatus,
      );

      const technician =
        booking.user_booking_technicianIdTouser;

      /*
       * Use the booking ID to create a stable invoice number.
       * This avoids displaying an unrelated payment amount.
       */
      const invoiceId = `INV-${booking.id
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-8)
        .toUpperCase()}`;

      return {
        id: invoiceId,

        invoiceId,

        bookingId: booking.id,

        serviceId: booking.serviceId,

        serviceName:
          booking.service?.name ||
          booking.bookingitem?.[0]?.serviceName ||
          "Home Service",

        serviceCategory:
          booking.service?.category ||
          "Home Services",

        serviceSlug:
          booking.service?.slug ||
          null,

        serviceImage:
          booking.service?.image ||
          null,

        technicianId:
          technician?.id ||
          booking.technicianId ||
          null,

        technicianName:
          technician?.name ||
          "Unassigned",

        technicianPhone:
          technician?.phone ||
          null,

        technicianEmail:
          technician?.email ||
          null,

        technicianProfile:
          technician?.technicianprofile || null,

        scheduledDate:
          booking.scheduledDate,

        scheduledTime:
          booking.scheduledTime,

        address:
          booking.address,

        notes:
          booking.notes,

        bookingStatus:
          booking.status,

        paymentStatus,

        /*
         * REAL BOOKING AMOUNT
         */
        amount: totalAmount,

        subtotal: totalAmount,

        /*
         * No tax is invented here.
         * Your database does not contain an invoice tax field.
         */
        tax: 0,

        total: totalAmount,

        paymentId:
          payment?.id ||
          null,

        method:
          payment?.method ||
          "manual",

        transactionId:
          payment?.transactionId ||
          null,

        paymentAmount:
          payment?.amount != null
            ? Number(payment.amount)
            : totalAmount,

        createdAt:
          booking.createdAt,

        paymentCreatedAt:
          payment?.createdAt ||
          null,

        items:
          booking.bookingitem.map((item) => ({
            id: item.id,

            serviceId:
              item.serviceId,

            serviceName:
              item.serviceName,

            variantId:
              item.variantId,

            variantName:
              item.variantName,

            quantity:
              Number(item.quantity || 1),

            unitPrice:
              Number(item.unitPrice || 0),

            duration:
              item.duration,

            lineTotal:
              Number(item.unitPrice || 0) *
              Number(item.quantity || 1),
          })),
      };
    });

    /*
     * Summary values are calculated from the same
     * invoice totals shown in the list.
     */

    const totalPaid = invoices
      .filter(
        (invoice) =>
          invoice.paymentStatus === "paid",
      )
      .reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0,
      );

    const totalPending = invoices
      .filter(
        (invoice) =>
          invoice.paymentStatus === "pending",
      )
      .reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0,
      );

    const totalFailed = invoices
      .filter(
        (invoice) =>
          invoice.paymentStatus === "failed",
      )
      .reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0,
      );

    return NextResponse.json(
      {
        invoices,

        summary: {
          totalPaid,
          totalPending,
          totalFailed,
          count: invoices.length,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Customer invoices API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
      },
      {
        status: 500,
      },
    );
  }
}
