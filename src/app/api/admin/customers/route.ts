import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function getAdminFromSession(session: string): string | null {
  try {
    const decoded = JSON.parse(atob(session));

    if (decoded.role !== "admin") {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

/* =========================================================
   GET CUSTOMERS
   - Loads real customers
   - Loads subscription
   - Calculates real booking count from booking.customerId
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie || !getAdminFromSession(sessionCookie)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /* -------------------------------------------------------
       Load customers
    ------------------------------------------------------- */

    const customers = await prisma.user.findMany({
      where: {
        role: "customer",
      },

      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        subscription: {
          select: {
            plan: true,
            status: true,
            amount: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    /* -------------------------------------------------------
       Load booking counts directly from booking.customerId.

       We intentionally do NOT use:

       _count: {
         select: {
           bookings: true
         }
       }

       because your Prisma schema does not expose a
       "bookings" relation on user.
    ------------------------------------------------------- */

    const bookingCounts = await prisma.booking.groupBy({
      by: ["customerId"],

      _count: {
        _all: true,
      },
    });

    /* -------------------------------------------------------
       Convert booking counts into a quick lookup object
    ------------------------------------------------------- */

    const bookingCountMap = new Map<string, number>();

    for (const item of bookingCounts) {
      bookingCountMap.set(
        item.customerId,
        item._count._all,
      );
    }

    /* -------------------------------------------------------
       Return frontend-friendly customer objects
    ------------------------------------------------------- */

    const formattedCustomers = customers.map((customer) => {
      const bookingCount =
        bookingCountMap.get(customer.id) ?? 0;

      return {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        createdAt: customer.createdAt,

        subscription: customer.subscription,

        /*
         * Keep _count because the Admin Customers
         * frontend uses customer._count.bookings.
         */
        _count: {
          bookings: bookingCount,
        },

        /*
         * Also expose bookings for compatibility
         * with the existing frontend code.
         */
        bookings: bookingCount,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
    });
  } catch (error) {
    console.error("List customers error:", error);

    return NextResponse.json(
      {
        error: "Failed to list customers",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   CREATE CUSTOMER
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie || !getAdminFromSession(sessionCookie)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const {
      phone,
      password,
      name,
    } = body;

    /* -------------------------------------------------------
       Validate phone
    ------------------------------------------------------- */

    if (
      !phone ||
      typeof phone !== "string" ||
      phone.length !== 10
    ) {
      return NextResponse.json(
        {
          error:
            "Valid 10-digit phone number required",
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       Validate password
    ------------------------------------------------------- */

    if (
      !password ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters",
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       Check duplicate phone
    ------------------------------------------------------- */

    const existing = await prisma.user.findUnique({
      where: {
        phone,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Account already exists with this phone number",
        },
        {
          status: 409,
        },
      );
    }

    /* -------------------------------------------------------
       Hash password
    ------------------------------------------------------- */

    const hashedPassword = await bcrypt.hash(
      password,
      10,
    );

    /* -------------------------------------------------------
       Create customer
    ------------------------------------------------------- */

    const customer = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        name: name || null,
        role: "customer",
      },

      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      customer: {
        ...customer,

        bookings: 0,

        _count: {
          bookings: 0,
        },

        subscription: null,
      },
    });
  } catch (error) {
    console.error(
      "Create customer error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to create customer",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   UPDATE CUSTOMER
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie || !getAdminFromSession(sessionCookie)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const {
      userId,
      name,
      phone,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId is required",
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       Validate phone
    ------------------------------------------------------- */

    if (
      phone &&
      (
        typeof phone !== "string" ||
        phone.length !== 10
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Valid 10-digit phone number required",
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       Check duplicate phone
    ------------------------------------------------------- */

    if (phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone,

          NOT: {
            id: userId,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error:
              "Phone number already in use",
          },
          {
            status: 409,
          },
        );
      }
    }

    /* -------------------------------------------------------
       Update customer
    ------------------------------------------------------- */

    const customer = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        name,
        phone,
      },

      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      customer,
    });
  } catch (error) {
    console.error(
      "Update customer error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to update customer",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   DELETE CUSTOMER
========================================================= */

export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie || !getAdminFromSession(sessionCookie)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const url = new URL(request.url);

    let userId: string | undefined;

    if (
      request
        .headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      const body = await request.json();

      userId = body.userId;
    } else {
      userId =
        url.searchParams.get("userId") ??
        undefined;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId is required",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete customer error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to delete customer",
      },
      {
        status: 500,
      },
    );
  }
}
