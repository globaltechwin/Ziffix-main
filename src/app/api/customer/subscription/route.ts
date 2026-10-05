import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

type PlanConfig = {
  name: string;
  amount: number;
  durationDays: number;
};

const PLANS: Record<string, PlanConfig> = {
  free: {
    name: "Free",
    amount: 0,
    durationDays: 30,
  },

  starter: {
    name: "Starter",
    amount: 499,
    durationDays: 30,
  },

  pro: {
    name: "Pro",
    amount: 999,
    durationDays: 30,
  },
};

/* =========================================================
   SESSION
========================================================= */

function getUserIdFromSession(
  session: string | undefined
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

/* =========================================================
   GET CURRENT SUBSCRIPTION
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId =
      getUserIdFromSession(sessionCookie);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
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
          paymentMethod: true,
          paymentReference: true,
          startDate: true,
          endDate: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,

      plan:
        subscription?.plan ||
        "free",

      subscription,
    });
  } catch (error) {
    console.error(
      "Get customer subscription error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load subscription",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST MANUAL SUBSCRIPTION PAYMENT
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* -------------------------------------------------------
       AUTH
    ------------------------------------------------------- */

    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId =
      getUserIdFromSession(sessionCookie);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* -------------------------------------------------------
       REQUEST
    ------------------------------------------------------- */

    const body =
      await request.json();

    const plan =
      typeof body.plan === "string"
        ? body.plan.trim().toLowerCase()
        : "";

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod.trim().toLowerCase()
        : "manual";

    const paymentReference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim()
        : "";

    /* -------------------------------------------------------
       VALIDATE PLAN
    ------------------------------------------------------- */

    const planConfig =
      PLANS[plan];

    if (!planConfig) {
      return NextResponse.json(
        {
          error: "Invalid subscription plan",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       FREE PLAN
    ------------------------------------------------------- */

    if (plan === "free") {
      return NextResponse.json(
        {
          error:
            "Free plan does not require payment",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       VALIDATE PAYMENT REFERENCE
    ------------------------------------------------------- */

    if (!paymentReference) {
      return NextResponse.json(
        {
          error:
            "UTR / transaction reference is required",
        },
        {
          status: 400,
        }
      );
    }

    if (paymentReference.length < 6) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid UTR / transaction reference",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       VALIDATE PAYMENT METHOD
    ------------------------------------------------------- */

    const allowedMethods = [
      "bank",
      "gpay",
      "qr",
      "manual",
    ];

    const normalizedPaymentMethod =
      allowedMethods.includes(
        paymentMethod
      )
        ? paymentMethod
        : "manual";

    /* -------------------------------------------------------
       EXISTING SUBSCRIPTION
    ------------------------------------------------------- */

    const existing =
      await prisma.subscription.findUnique({
        where: {
          userId,
        },
      });

    /*
     * If the same customer already has an active plan,
     * do not replace it until the new payment is verified.
     */
    if (
      existing?.status === "active" &&
      existing.plan === plan
    ) {
      return NextResponse.json(
        {
          error:
            "You are already subscribed to this plan",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
       CREATE / UPDATE PENDING SUBSCRIPTION
    ------------------------------------------------------- */

    const subscriptionId =
      existing?.id ||
      crypto.randomUUID();

    const subscription =
      existing
        ? await prisma.subscription.update({
            where: {
              userId,
            },

            data: {
              plan,

              status:
                "pending",

              amount:
                planConfig.amount,

              paymentMethod:
                normalizedPaymentMethod,

              paymentReference,

              startDate:
                null,

              endDate:
                null,

              verifiedAt:
                null,

              updatedAt:
                new Date(),
            },

            select: {
              id: true,
              userId: true,
              plan: true,
              status: true,
              amount: true,
              paymentMethod: true,
              paymentReference: true,
              startDate: true,
              endDate: true,
              verifiedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : await prisma.subscription.create({
            data: {
              id:
                subscriptionId,

              userId,

              plan,

              status:
                "pending",

              amount:
                planConfig.amount,

              paymentMethod:
                normalizedPaymentMethod,

              paymentReference,

              startDate:
                null,

              endDate:
                null,

              verifiedAt:
                null,

              updatedAt:
                new Date(),
            },

            select: {
              id: true,
              userId: true,
              plan: true,
              status: true,
              amount: true,
              paymentMethod: true,
              paymentReference: true,
              startDate: true,
              endDate: true,
              verifiedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          });

    /* -------------------------------------------------------
       CUSTOMER NOTIFICATION
    ------------------------------------------------------- */

    await prisma.notification.create({
      data: {
        id:
          crypto.randomUUID(),

        userId,

        title:
          "Subscription payment submitted",

        message:
          `Your ${planConfig.name} plan payment of ₹${planConfig.amount.toLocaleString(
            "en-IN"
          )} has been submitted for verification. UTR: ${paymentReference}`,

        type:
          "payment",

        isRead:
          false,

        createdAt:
          new Date(),
      },
    });

    /* -------------------------------------------------------
       ADMIN NOTIFICATIONS
    ------------------------------------------------------- */

    const admins =
      await prisma.user.findMany({
        where: {
          role: "admin",
        },

        select: {
          id: true,
        },
      });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          id:
            crypto.randomUUID(),

          userId:
            admin.id,

          title:
            "New subscription payment",

          message:
            `A customer submitted ₹${planConfig.amount.toLocaleString(
              "en-IN"
            )} for the ${planConfig.name} plan. UTR: ${paymentReference}`,

          type:
            "payment",

          isRead:
            false,

          createdAt:
            new Date(),
        })),
      });
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment submitted successfully. Waiting for admin verification.",

        subscription,

        redirectTo:
          `/customer/payment/success?plan=${encodeURIComponent(
            plan
          )}&amount=${encodeURIComponent(
            String(planConfig.amount)
          )}`,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create manual subscription request error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit subscription payment",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH DOWNGRADE / FREE PLAN
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const sessionCookie =
      request.cookies.get("session")?.value;

    const userId =
      getUserIdFromSession(sessionCookie);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const plan =
      typeof body.plan === "string"
        ? body.plan.trim().toLowerCase()
        : "";

    if (
      !["free", "starter", "pro"].includes(
        plan
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid plan",
        },
        {
          status: 400,
        }
      );
    }

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
          endDate: true,
        },
      });

    /* -------------------------------------------------------
       FREE
    ------------------------------------------------------- */

    if (plan === "free") {
      if (!existing) {
        return NextResponse.json({
          plan: "free",
        });
      }

      return NextResponse.json({
        plan: "free",

        scheduled:
          true,

        endDate:
          existing.endDate,

        message:
          existing.endDate
            ? `Your ${existing.plan} plan remains active until ${new Date(
                existing.endDate
              ).toLocaleDateString(
                "en-IN"
              )}. After that, you'll be on the Free plan.`
            : "Your plan will be changed to Free.",
      });
    }

    /* -------------------------------------------------------
       EXISTING PLAN
    ------------------------------------------------------- */

    if (existing) {
      const planOrder: Record<
        string,
        number
      > = {
        free: 0,
        starter: 1,
        pro: 2,
      };

      if (
        planOrder[plan] >
        planOrder[existing.plan]
      ) {
        return NextResponse.json(
          {
            error:
              "Upgrades require payment",
          },
          {
            status: 400,
          }
        );
      }

      const amount =
        plan === "starter"
          ? 499
          : plan === "pro"
            ? 999
            : 0;

      const updated =
        await prisma.subscription.update({
          where: {
            userId,
          },

          data: {
            plan,

            status:
              "active",

            amount,

            paymentMethod:
              null,

            paymentReference:
              null,

            verifiedAt:
              new Date(),

            updatedAt:
              new Date(),
          },
        });

      return NextResponse.json({
        plan:
          updated.plan,
      });
    }

    /* -------------------------------------------------------
       CREATE FREE
    ------------------------------------------------------- */

    if (plan !== "free") {
      return NextResponse.json(
        {
          error:
            "Upgrades require payment",
        },
        {
          status: 400,
        }
      );
    }

    const created =
      await prisma.subscription.create({
        data: {
          id:
            crypto.randomUUID(),

          userId,

          plan:
            "free",

          status:
            "active",

          amount:
            0,

          startDate:
            new Date(),

          updatedAt:
            new Date(),
        },
      });

    return NextResponse.json({
      plan:
        created.plan,
    });
  } catch (error) {
    console.error(
      "Update subscription error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update subscription",
      },
      {
        status: 500,
      }
    );
  }
}
