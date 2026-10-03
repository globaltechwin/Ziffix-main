import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SessionData = {
  id?: string;
  userId?: string;
  role?: string;
};

function getSession(request: NextRequest): SessionData | null {
  try {
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return null;
    }

    return JSON.parse(atob(session)) as SessionData;
  } catch {
    return null;
  }
}

async function getAdmin(request: NextRequest) {
  const session = getSession(request);

  if (!session) {
    return null;
  }

  const userId = session.id ?? session.userId;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

/**
 * GET /api/admin/subscriptions
 *
 * Returns all customer subscriptions for the admin portal.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const formattedSubscriptions = subscriptions.map((subscription) => ({
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      amount: Number(subscription.amount),
      status: subscription.status,
      paymentMethod: subscription.paymentMethod ?? null,
      paymentReference: subscription.paymentReference ?? null,
      startDate: subscription.startDate
        ? subscription.startDate.toISOString()
        : null,
      endDate: subscription.endDate
        ? subscription.endDate.toISOString()
        : null,
      verifiedAt: subscription.verifiedAt
        ? subscription.verifiedAt.toISOString()
        : null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
      user: {
        id: subscription.user.id,
        name: subscription.user.name ?? "Unknown customer",
        email: subscription.user.email ?? "",
        phone: subscription.user.phone ?? "",
      },
    }));

    return NextResponse.json({
      success: true,
      subscriptions: formattedSubscriptions,
    });
  } catch (error) {
    console.error("GET /api/admin/subscriptions error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load subscriptions",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH /api/admin/subscriptions
 *
 * Verify or reject a subscription payment.
 *
 * Body:
 * {
 *   id: string;
 *   action: "verify" | "reject";
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    const action =
      typeof body?.action === "string"
        ? body.action.trim().toLowerCase()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (action !== "verify" && action !== "reject") {
      return NextResponse.json(
        {
          success: false,
          error: "Action must be verify or reject",
        },
        {
          status: 400,
        },
      );
    }

    const existing = await prisma.subscription.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription not found",
        },
        {
          status: 404,
        },
      );
    }

    if (action === "verify") {
      const startDate = new Date();

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const updated = await prisma.subscription.update({
        where: {
          id,
        },
        data: {
          status: "active",
          startDate,
          endDate,
          verifiedAt: startDate,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Notify customer.
      try {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: updated.userId,
            title: "Subscription verified",
            message: `Your ${updated.plan} subscription payment has been verified. Your subscription is now active.`,
            type: "success",
            isRead: false,
          },
        });
      } catch (notificationError) {
        console.error(
          "Subscription verification notification error:",
          notificationError,
        );
      }

      return NextResponse.json({
        success: true,
        message: "Subscription verified successfully",
        subscription: {
          id: updated.id,
          userId: updated.userId,
          plan: updated.plan,
          amount: Number(updated.amount),
          status: updated.status,
          paymentMethod: updated.paymentMethod ?? null,
          paymentReference: updated.paymentReference ?? null,
          startDate: updated.startDate
            ? updated.startDate.toISOString()
            : null,
          endDate: updated.endDate
            ? updated.endDate.toISOString()
            : null,
          verifiedAt: updated.verifiedAt
            ? updated.verifiedAt.toISOString()
            : null,
          user: {
            id: updated.user.id,
            name: updated.user.name ?? "Unknown customer",
            email: updated.user.email ?? "",
            phone: updated.user.phone ?? "",
          },
        },
      });
    }

    const updated = await prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: "rejected",
        startDate: null,
        endDate: null,
        verifiedAt: null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Notify customer.
    try {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: updated.userId,
          title: "Subscription payment rejected",
          message: `Your ${updated.plan} subscription payment could not be verified. Please check your payment details and submit again.`,
          type: "warning",
          isRead: false,
        },
      });
    } catch (notificationError) {
      console.error(
        "Subscription rejection notification error:",
        notificationError,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription rejected",
      subscription: {
        id: updated.id,
        userId: updated.userId,
        plan: updated.plan,
        amount: Number(updated.amount),
        status: updated.status,
        paymentMethod: updated.paymentMethod ?? null,
        paymentReference: updated.paymentReference ?? null,
        startDate: null,
        endDate: null,
        verifiedAt: null,
        user: {
          id: updated.user.id,
          name: updated.user.name ?? "Unknown customer",
          email: updated.user.email ?? "",
          phone: updated.user.phone ?? "",
        },
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/subscriptions error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update subscription",
      },
      {
        status: 500,
      },
    );
  }
}
