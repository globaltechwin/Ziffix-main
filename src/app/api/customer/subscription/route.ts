import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type PlanId = "free" | "starter" | "pro";

const PLAN_CONFIG: Record<
  PlanId,
  {
    amount: number;
    durationDays: number;
  }
> = {
  free: {
    amount: 0,
    durationDays: 0,
  },
  starter: {
    amount: 499,
    durationDays: 30,
  },
  pro: {
    amount: 999,
    durationDays: 30,
  },
};

const PLAN_ORDER: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

function getUserIdFromSession(
  session: string | undefined,
): string | null {
  if (!session) {
    return null;
  }

  try {
    const decoded = JSON.parse(atob(session));

    if (!decoded?.userId) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

function isValidPlan(value: unknown): value is PlanId {
  return (
    value === "free" ||
    value === "starter" ||
    value === "pro"
  );
}

/* =========================================================
   GET CURRENT SUBSCRIPTION
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId = getUserIdFromSession(sessionCookie);

    if (!userId) {
      return NextResponse.json({
        plan: "free",
        status: "inactive",
      });
    }

    const subscription =
      await prisma.subscription.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
          userId: true,
          plan: true,
          status: true,
          amount: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!subscription) {
      return NextResponse.json({
        plan: "free",
        status: "inactive",
      });
    }

    /*
     * An expired subscription is treated as Free.
     */
    if (
      subscription.endDate &&
      new Date(subscription.endDate).getTime() <
        Date.now()
    ) {
      return NextResponse.json({
        plan: "free",
        status: "expired",
        subscription,
      });
    }

    /*
     * Only an active subscription should make
     * the customer appear subscribed.
     */
    if (subscription.status !== "active") {
      return NextResponse.json({
        plan: "free",
        status: subscription.status,
        subscription,
      });
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      amount: subscription.amount,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      subscription,
    });
  } catch (error) {
    console.error(
      "Get customer subscription error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load subscription",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PATCH SUBSCRIPTION
   Used for downgrades / Free plan changes.
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId = getUserIdFromSession(sessionCookie);

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

    const body = await request.json();

    const requestedPlan = body?.plan;

    if (!isValidPlan(requestedPlan)) {
      return NextResponse.json(
        {
          error: "Invalid plan",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.subscription.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
          userId: true,
          plan: true,
          status: true,
          amount: true,
          startDate: true,
          endDate: true,
        },
      });

    /*
     * -------------------------------------------------------
     * FREE PLAN
     * -------------------------------------------------------
     */

    if (requestedPlan === "free") {
      /*
       * If there is no subscription, customer is already Free.
       */
      if (!existing) {
        return NextResponse.json({
          success: true,
          plan: "free",
          status: "inactive",
        });
      }

      /*
       * If a paid plan is still active, don't immediately
       * destroy it. Tell the customer when it ends.
       */
      if (
        existing.endDate &&
        new Date(existing.endDate).getTime() >
          Date.now()
      ) {
        return NextResponse.json({
          success: true,
          plan: "free",
          scheduled: true,
          currentPlan: existing.plan,
          endDate: existing.endDate,
          message: `Your ${existing.plan} plan remains active until ${new Date(
            existing.endDate,
          ).toLocaleDateString("en-IN")}.`,
        });
      }

      const updated =
        await prisma.subscription.update({
          where: {
            userId,
          },
          data: {
            plan: "free",
            amount: 0,
            status: "active",
            startDate: new Date(),
            endDate: null,
            updatedAt: new Date(),
          },
        });

      return NextResponse.json({
        success: true,
        plan: updated.plan,
        status: updated.status,
        subscription: updated,
      });
    }

    /*
     * -------------------------------------------------------
     * PAID PLAN
     * -------------------------------------------------------
     *
     * PATCH is intentionally only for downgrades.
     * Upgrades should come through the manual payment page.
     */

    if (existing) {
      const currentPlan = isValidPlan(existing.plan)
        ? existing.plan
        : "free";

      if (
        PLAN_ORDER[requestedPlan] >
        PLAN_ORDER[currentPlan]
      ) {
        return NextResponse.json(
          {
            error:
              "Upgrades require manual payment verification.",
          },
          {
            status: 400,
          },
        );
      }

      const config =
        PLAN_CONFIG[requestedPlan];

      const startDate = new Date();

      const endDate = new Date();

      endDate.setDate(
        endDate.getDate() + config.durationDays,
      );

      const updated =
        await prisma.subscription.update({
          where: {
            userId,
          },
          data: {
            plan: requestedPlan,
            amount: config.amount,
            status: "active",
            startDate,
            endDate,
            updatedAt: new Date(),
          },
        });

      return NextResponse.json({
        success: true,
        plan: updated.plan,
        status: updated.status,
        amount: updated.amount,
        startDate: updated.startDate,
        endDate: updated.endDate,
        subscription: updated,
      });
    }

    /*
     * No previous subscription.
     *
     * We don't activate a paid subscription here because
     * paid plans must go through the manual payment flow.
     */
    return NextResponse.json(
      {
        error:
          "Please complete manual payment for this plan.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Update customer subscription error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to update subscription",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST MANUAL SUBSCRIPTION REQUEST
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId = getUserIdFromSession(sessionCookie);

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

    const body = await request.json();

    const requestedPlan = body?.plan;

    if (!isValidPlan(requestedPlan)) {
      return NextResponse.json(
        {
          error: "Invalid plan",
        },
        {
          status: 400,
        },
      );
    }

    if (requestedPlan === "free") {
      return NextResponse.json(
        {
          error:
            "Free plan does not require payment.",
        },
        {
          status: 400,
        },
      );
    }

    const config =
      PLAN_CONFIG[requestedPlan];

    /*
     * Check whether the customer already has
     * an active subscription.
     */
    const existing =
      await prisma.subscription.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
          plan: true,
          status: true,
          amount: true,
          startDate: true,
          endDate: true,
        },
      });

    if (
      existing &&
      existing.status === "active" &&
      existing.endDate &&
      new Date(existing.endDate).getTime() >
        Date.now()
    ) {
      const currentPlan = isValidPlan(existing.plan)
        ? existing.plan
        : "free";

      if (
        PLAN_ORDER[requestedPlan] <=
        PLAN_ORDER[currentPlan]
      ) {
        return NextResponse.json({
          success: true,
          alreadyActive: true,
          plan: existing.plan,
          status: existing.status,
          subscription: existing,
        });
      }
    }

    /*
     * IMPORTANT:
     *
     * This creates a PENDING subscription request.
     *
     * It does NOT mark the plan as active.
     *
     * Admin/manual-payment verification should later
     * change status from "pending" to "active".
     */
    const now = new Date();

    const subscription =
      await prisma.subscription.upsert({
        where: {
          userId,
        },

        update: {
          plan: requestedPlan,
          amount: config.amount,
          status: "pending",
          startDate: now,
          endDate: null,
          updatedAt: now,
        },

        create: {
          id: randomUUID(),
          userId,
          plan: requestedPlan,
          amount: config.amount,
          status: "pending",
          startDate: now,
          endDate: null,
          createdAt: now,
          updatedAt: now,
        },

        select: {
          id: true,
          userId: true,
          plan: true,
          amount: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Subscription payment submitted for manual verification.",
        subscription,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create manual subscription request error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create subscription payment request",
      },
      {
        status: 500,
      },
    );
  }
}
