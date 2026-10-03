import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getAdminFromSession(session: string): string | null {
  try {
    const decoded = JSON.parse(atob(session));

    if (decoded.role !== "admin") {
      return null;
    }

    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie || !getAdminFromSession(sessionCookie)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );

    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
      0,
      0,
      0,
      0,
    );

    const [
      totalCustomers,
      activeTechnicians,
      activeBookings,
      completedThisMonth,
      revenueResult,
      pendingPayments,
      avgRatingResult,
      newCustomersThisMonth,
      recentBookings,
      recentPayments,
      monthlyRevenueRaw,
    ] = await Promise.all([
      /*
       * TOTAL CUSTOMERS
       */
      prisma.user.count({
        where: {
          role: "customer",
        },
      }),

      /*
       * ACTIVE TECHNICIANS
       *
       * Only technicians who are currently
       * available or busy.
       */
      prisma.user.count({
        where: {
          role: "technician",
          technicianprofile: {
            status: {
              in: ["available", "busy"],
            },
          },
        },
      }),

      /*
       * ACTIVE BOOKINGS
       */
      prisma.booking.count({
        where: {
          status: {
            in: [
              "pending",
              "confirmed",
              "in_progress",
            ],
          },
        },
      }),

      /*
       * COMPLETED BOOKINGS THIS MONTH
       */
      prisma.booking.count({
        where: {
          status: "completed",
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),

      /*
       * TOTAL VERIFIED REVENUE
       *
       * Only completed payments count
       * as actual revenue.
       */
      prisma.payment.aggregate({
        where: {
          status: "completed",
        },
        _sum: {
          amount: true,
        },
      }),

      /*
       * PENDING PAYMENTS
       */
      prisma.payment.count({
        where: {
          status: "pending",
        },
      }),

      /*
       * AVERAGE TECHNICIAN RATING
       */
      prisma.technicianprofile.aggregate({
        _avg: {
          rating: true,
        },
      }),

      /*
       * NEW CUSTOMERS THIS MONTH
       */
      prisma.user.count({
        where: {
          role: "customer",
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),

      /*
       * RECENT BOOKINGS
       */
      prisma.booking.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user_booking_customerIdTouser: {
            select: {
              name: true,
              phone: true,
            },
          },

          service: {
            select: {
              name: true,
            },
          },
        },
      }),

      /*
       * RECENT PAYMENTS
       *
       * Include the payment status so the
       * dashboard can clearly distinguish
       * pending and completed payments.
       */
      prisma.payment.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },

          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      }),

      /*
       * MONTHLY REVENUE
       *
       * Only completed payments are counted.
       */
      prisma.payment.findMany({
        where: {
          status: "completed",
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    /*
     * MONTHLY REVENUE MAP
     */
    const monthlyRevenueMap: Record<string, number> = {};

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      monthlyRevenueMap[key] = 0;
    }

    for (const payment of monthlyRevenueRaw) {
      const date = new Date(payment.createdAt);

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (key in monthlyRevenueMap) {
        monthlyRevenueMap[key] += Number(
          payment.amount ?? 0,
        );
      }
    }

    const monthlyRevenue = Object.entries(
      monthlyRevenueMap,
    ).map(([key, value]) => {
      const [year, month] = key
        .split("-")
        .map(Number);

      return {
        month: monthNames[month],
        value,
        year,
      };
    });

    /*
     * RECENT ACTIVITY
     */
    const recentBookingActivity = recentBookings.map(
      (booking) => {
        const customer =
          booking.user_booking_customerIdTouser;

        const customerName =
          customer.name ||
          customer.phone ||
          "Customer";

        return {
          id: `booking-${booking.id}`,
          type: "booking",
          message: `${customerName} booked ${booking.service.name}`,
          userName: customerName,
          timestamp: booking.createdAt.toISOString(),
        };
      },
    );

    const recentPaymentActivity = recentPayments.map(
      (payment) => {
        const customerName =
          payment.user.name ||
          payment.user.phone ||
          "Customer";

        const amount = Number(payment.amount ?? 0);

        const isCompleted =
          payment.status === "completed";

        return {
          id: `payment-${payment.id}`,
          type: "payment",
          status: payment.status,
          message: isCompleted
            ? `₹${amount.toLocaleString(
                "en-IN",
              )} payment verified from ${customerName}`
            : `₹${amount.toLocaleString(
                "en-IN",
              )} payment pending from ${customerName}`,
          userName: customerName,
          timestamp: payment.createdAt.toISOString(),
        };
      },
    );

    const recentActivity = [
      ...recentBookingActivity,
      ...recentPaymentActivity,
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    /*
     * FINAL RESPONSE
     */
    return NextResponse.json({
      totalCustomers,

      totalTechnicians: activeTechnicians,

      activeBookings,

      completedThisMonth,

      totalRevenue:
        revenueResult._sum.amount ?? 0,

      pendingPayments,

      avgRating:
        avgRatingResult._avg.rating ?? 0,

      newCustomersThisMonth,

      recentActivity,

      monthlyRevenue,
    });
  } catch (error) {
    console.error(
      "Admin dashboard stats error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch admin dashboard stats",
      },
      {
        status: 500,
      },
    );
  }
}
