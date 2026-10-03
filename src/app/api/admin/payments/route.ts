import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getAdminFromSession(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(atob(sessionCookie));

    if (session.role !== "admin") {
      return null;
    }

    return session.userId || null;
  } catch {
    return null;
  }
}

/* =========================================================
   GET PAYMENTS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const adminId = getAdminFromSession(request);

    if (!adminId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            address: true,

            service: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },

            user_booking_technicianIdTouser: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,

      amount: Number(payment.amount || 0),

      method: payment.method || "manual",

      status: payment.status || "pending",

      transactionId:
        payment.transactionId || "Not provided",

      createdAt: payment.createdAt,

      bookingId: payment.bookingId,

      customer: {
        id: payment.user?.id || payment.customerId,
        name: payment.user?.name || "Unknown customer",
        phone: payment.user?.phone || "No phone",
        email: payment.user?.email || null,
      },

      booking: {
        id: payment.booking?.id || payment.bookingId,

        serviceName:
          payment.booking?.service?.name ||
          "Service",

        category:
          payment.booking?.service?.category ||
          "Home Service",

        scheduledDate:
          payment.booking?.scheduledDate || null,

        scheduledTime:
          payment.booking?.scheduledTime || null,

        status:
          payment.booking?.status || "pending",

        paymentStatus:
          payment.booking?.paymentStatus || payment.status,

        totalAmount:
          payment.booking?.totalAmount || payment.amount,

        address:
          payment.booking?.address || "",

        technician:
          payment.booking
            ?.user_booking_technicianIdTouser
            ? {
                id: payment.booking
                  .user_booking_technicianIdTouser.id,

                name:
                  payment.booking
                    .user_booking_technicianIdTouser
                    .name || "Technician",

                phone:
                  payment.booking
                    .user_booking_technicianIdTouser
                    .phone || "No phone",
              }
            : null,
      },
    }));

    return NextResponse.json({
      payments: formattedPayments,
    });
  } catch (error) {
    console.error("Admin payments GET error:", error);

    return NextResponse.json(
      {
        error: "Failed to load payments",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PATCH PAYMENT
   VERIFY / REFUND
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const adminId = getAdminFromSession(request);

    if (!adminId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const paymentId =
      typeof body?.paymentId === "string"
        ? body.paymentId.trim()
        : "";

    const action =
      typeof body?.action === "string"
        ? body.action.trim().toLowerCase()
        : "";

    if (!paymentId) {
      return NextResponse.json(
        {
          error: "Payment ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action !== "verify" &&
      action !== "refund"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Use verify or refund.",
        },
        {
          status: 400,
        },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },

      include: {
        booking: {
          select: {
            id: true,
            customerId: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          error: "Payment not found",
        },
        {
          status: 404,
        },
      );
    }

    /* =====================================================
       VERIFY
    ===================================================== */

    if (action === "verify") {
      if (payment.status === "completed") {
        return NextResponse.json(
          {
            error:
              "This payment has already been verified.",
          },
          {
            status: 409,
          },
        );
      }

      if (payment.status === "refunded") {
        return NextResponse.json(
          {
            error:
              "A refunded payment cannot be verified.",
          },
          {
            status: 409,
          },
        );
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const updatedPayment =
            await tx.payment.update({
              where: {
                id: paymentId,
              },

              data: {
                status: "completed",
              },

              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },

                booking: {
                  select: {
                    id: true,
                    status: true,
                    paymentStatus: true,
                    totalAmount: true,
                    service: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            });

          await tx.booking.update({
            where: {
              id: payment.bookingId,
            },

            data: {
              paymentStatus: "paid",
            },
          });

          await tx.notification.create({
            data: {
              id: crypto.randomUUID(),

              userId: payment.customerId,

              title: "Payment Verified",

              message: `Your payment of ₹${Number(
                payment.amount,
              ).toLocaleString("en-IN")} for ${
                payment.booking?.service?.name ||
                "your booking"
              } has been verified successfully.`,

              type: "payment",

              isRead: false,
            },
          });

          return updatedPayment;
        },
      );

      return NextResponse.json({
        success: true,

        message:
          "Payment verified successfully.",

        payment: result,
      });
    }

    /* =====================================================
       REFUND
    ===================================================== */

    if (action === "refund") {
      if (payment.status !== "completed") {
        return NextResponse.json(
          {
            error:
              "Only completed payments can be refunded.",
          },
          {
            status: 409,
          },
        );
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const updatedPayment =
            await tx.payment.update({
              where: {
                id: paymentId,
              },

              data: {
                status: "refunded",
              },

              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },

                booking: {
                  select: {
                    id: true,
                    status: true,
                    paymentStatus: true,
                    totalAmount: true,
                    service: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            });

          await tx.booking.update({
            where: {
              id: payment.bookingId,
            },

            data: {
              paymentStatus: "refunded",
            },
          });

          await tx.notification.create({
            data: {
              id: crypto.randomUUID(),

              userId: payment.customerId,

              title: "Payment Refunded",

              message: `Your payment of ₹${Number(
                payment.amount,
              ).toLocaleString("en-IN")} has been marked as refunded by Ziffix.`,

              type: "payment",

              isRead: false,
            },
          });

          return updatedPayment;
        },
      );

      return NextResponse.json({
        success: true,

        message:
          "Payment refunded successfully.",

        payment: result,
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported action",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error("Admin payment PATCH error:", error);

    return NextResponse.json(
      {
        error:
          "Failed to update payment",
      },
      {
        status: 500,
      },
    );
  }
}
