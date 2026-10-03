import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

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

function getSessionUserId(
  request: NextRequest,
): string | null {
  try {
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(session, "base64").toString("utf-8"),
    );

    return decoded?.userId || decoded?.id || null;
  } catch {
    return null;
  }
}

/* =========================================================
   GET CUSTOMER BOOKINGS
========================================================= */

export async function GET(
  request: NextRequest,
) {
  try {
    const userId =
      getSessionUserId(request);

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

    const bookings =
      await prisma.booking.findMany({
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
              description: true,
              basePrice: true,
              image: true,
            },
          },

          /*
           * IMPORTANT:
           * Prisma relation name is NOT "technician".
           */
          user_booking_technicianIdTouser: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,

              technicianprofile: {
                select: {
                  id: true,
                  specialties: true,
                  rating: true,
                  totalJobs: true,
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

          bookingitem: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    /*
     * Convert Prisma relation names into
     * simple frontend-friendly objects.
     */
    const formattedBookings =
      bookings.map((booking) => {
        const technician =
          booking
            .user_booking_technicianIdTouser;

        return {
          ...booking,

          technician: technician
            ? {
                id: technician.id,
                name:
                  technician.name ||
                  "Technician",
                phone:
                  technician.phone || "",
                email:
                  technician.email || "",

                profile:
                  technician.technicianprofile
                    ? {
                        id:
                          technician
                            .technicianprofile
                            .id,

                        specialties:
                          technician
                            .technicianprofile
                            .specialties
                            ? technician
                                .technicianprofile
                                .specialties
                                .split(",")
                                .map(
                                  (item) =>
                                    item.trim(),
                                )
                                .filter(Boolean)
                            : [],

                        rating:
                          technician
                            .technicianprofile
                            .rating,

                        totalJobs:
                          technician
                            .technicianprofile
                            .totalJobs,

                        status:
                          technician
                            .technicianprofile
                            .status,

                        certifications:
                          technician
                            .technicianprofile
                            .certifications
                            ? technician
                                .technicianprofile
                                .certifications
                                .split(",")
                                .map(
                                  (item) =>
                                    item.trim(),
                                )
                                .filter(Boolean)
                            : [],
                      }
                    : null,
              }
            : null,

          /*
           * Keep the raw Prisma relation available
           * for compatibility with existing UI code.
           */
          user_booking_technicianIdTouser:
            undefined,
        };
      });

    return NextResponse.json({
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error(
      "Failed to fetch customer bookings:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch customer bookings",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST CUSTOMER BOOKING
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
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
       REQUEST BODY
    ------------------------------------------------------- */

    const body = await request.json();

    const {
      items,
      address,
      scheduledDate,
      scheduledTime,
      notes,
      paymentMethod,
      transactionId,
    } = body;

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (
      !address ||
      typeof address !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Service address is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !scheduledDate ||
      typeof scheduledDate !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Service date is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !scheduledTime ||
      typeof scheduledTime !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Service time is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one service is required",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       CART ITEM TYPE
    ------------------------------------------------------- */

    type IncomingItem = {
      id?: string;
      serviceId?: string;
      serviceTypeId?: string;
      serviceName?: string;
      variantId?: string | null;
      variantName?: string;
      price?: number;
      quantity?: number;
      duration?: string | number | null;
    };

    const incomingItems =
      items as IncomingItem[];

    /* -------------------------------------------------------
       VERIFY SERVICES AND VARIANTS
    ------------------------------------------------------- */

    const bookingItems: {
      serviceId: string;
      variantId: string | null;
      serviceName: string;
      variantName: string;
      quantity: number;
      unitPrice: number;
      duration: number | null;
    }[] = [];

    for (
      const item of incomingItems
    ) {
      const serviceId =
        item.serviceId ||
        item.serviceTypeId;

      if (!serviceId) {
        return NextResponse.json(
          {
            error:
              "A cart item is missing service information",
          },
          {
            status: 400,
          }
        );
      }

      const service =
        await prisma.service.findUnique({
          where: {
            id: serviceId,
          },
          include: {
            servicevariant: true,
          },
        });

      if (!service) {
        return NextResponse.json(
          {
            error:
              `Service not found: ${serviceId}`,
          },
          {
            status: 404,
          }
        );
      }

      const quantity = Math.max(
        1,
        Number(item.quantity || 1)
      );

      if (!Number.isInteger(quantity)) {
        return NextResponse.json(
          {
            error:
              `Invalid quantity for ${service.name}`,
          },
          {
            status: 400,
          }
        );
      }

      let variantId:
        | string
        | null = null;

      let variantName =
        item.variantName?.trim() ||
        service.name;

      let unitPrice =
        Number(item.price || 0);

      let duration:
        | number
        | null = null;

      /* -----------------------------------------------------
         VARIANT SERVICE
      ----------------------------------------------------- */

      if (item.variantId) {
        const variant =
          service.servicevariant.find(
            (entry) =>
              entry.id ===
              item.variantId
          );

        if (!variant) {
          return NextResponse.json(
            {
              error:
                `Variant not found for ${service.name}`,
            },
            {
              status: 400,
            }
          );
        }

        if (!variant.isActive) {
          return NextResponse.json(
            {
              error:
                `${variant.name} is not currently available`,
            },
            {
              status: 400,
            }
          );
        }

        variantId = variant.id;

        variantName =
          variant.name;

        unitPrice =
          variant.price;

        duration =
          variant.duration ??
          null;
      } else {
        /* ---------------------------------------------------
           NORMAL SERVICE
        --------------------------------------------------- */

        unitPrice =
          service.basePrice;

        variantName =
          item.variantName?.trim() ||
          service.name;

        duration =
          service.duration ??
          null;
      }

      /* -----------------------------------------------------
         FALLBACK DURATION
      ----------------------------------------------------- */

      if (duration === null) {
        if (
          typeof item.duration ===
            "number" &&
          Number.isFinite(
            item.duration
          )
        ) {
          duration = Math.max(
            0,
            Math.round(
              item.duration
            )
          );
        } else if (
          typeof item.duration ===
          "string"
        ) {
          const durationMatch =
            item.duration.match(
              /\d+/
            );

          if (durationMatch) {
            duration =
              Number(
                durationMatch[0]
              );
          }
        }
      }

      bookingItems.push({
        serviceId:
          service.id,

        variantId,

        serviceName:
          service.name,

        variantName,

        quantity,

        unitPrice,

        duration,
      });
    }

    /* -------------------------------------------------------
       CALCULATE VERIFIED TOTAL
    ------------------------------------------------------- */

    const totalAmount =
      bookingItems.reduce(
        (total, item) =>
          total +
          item.unitPrice *
            item.quantity,
        0
      );

    if (totalAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "Booking total must be greater than zero",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       CREATE BOOKING + ITEMS + PAYMENT
    ------------------------------------------------------- */

    const result =
      await prisma.$transaction(
        async (tx) => {
          const bookingId =
            crypto.randomUUID();

          /* -----------------------------------------------
             BOOKING
          ----------------------------------------------- */

          const booking =
            await tx.booking.create({
              data: {
                id: bookingId,

                customerId:
                  userId,

                /*
                 * Technician is intentionally
                 * NULL here.
                 *
                 * Admin assigns the technician later.
                 */
                technicianId:
                  null,

                serviceId:
                  bookingItems[0]
                    .serviceId,

                scheduledDate:
                  new Date(
                    scheduledDate
                  ),

                scheduledTime,

                address:
                  address.trim(),

                notes:
                  typeof notes ===
                    "string" &&
                  notes.trim()
                    ? notes.trim()
                    : null,

                totalAmount,

                status:
                  "pending",

                updatedAt:
                  new Date(),
              },
            });

          /* -----------------------------------------------
             BOOKING ITEMS
          ----------------------------------------------- */

          await tx.bookingitem.createMany(
            {
              data:
                bookingItems.map(
                  (item) => ({
                    id:
                      crypto.randomUUID(),

                    bookingId:
                      booking.id,

                    serviceId:
                      item.serviceId,

                    variantId:
                      item.variantId,

                    serviceName:
                      item.serviceName,

                    variantName:
                      item.variantName,

                    quantity:
                      item.quantity,

                    unitPrice:
                      item.unitPrice,

                    duration:
                      item.duration,
                  })
                ),
            }
          );

          /* -----------------------------------------------
             PAYMENT
          ----------------------------------------------- */

          const selectedPaymentMethod =
            typeof paymentMethod ===
              "string" &&
            paymentMethod.trim()
              ? paymentMethod.trim()
              : "manual";

          const selectedTransactionId =
            typeof transactionId ===
              "string" &&
            transactionId.trim()
              ? transactionId.trim()
              : `MANUAL-${booking.id}`;

          await tx.payment.create({
            data: {
              id:
                crypto.randomUUID(),

              bookingId:
                booking.id,

              customerId:
                userId,

              amount:
                totalAmount,

              method:
                selectedPaymentMethod,

              status:
                "pending",

              transactionId:
                selectedTransactionId,
            },
          });

          /* -----------------------------------------------
             SERVICE BOOKING COUNTER
          ----------------------------------------------- */

          const serviceIds =
            Array.from(
              new Set(
                bookingItems.map(
                  (item) =>
                    item.serviceId
                )
              )
            );

          for (
            const serviceId of
              serviceIds
          ) {
            const quantityForService =
              bookingItems
                .filter(
                  (item) =>
                    item.serviceId ===
                    serviceId
                )
                .reduce(
                  (total, item) =>
                    total +
                    item.quantity,
                  0
                );

            await tx.service.update({
              where: {
                id: serviceId,
              },

              data: {
                totalBookings: {
                  increment:
                    quantityForService,
                },
              },
            });
          }

          return booking;
        }
      );

    /* -------------------------------------------------------
       GET CREATED BOOKING
    ------------------------------------------------------- */

    const createdBooking =
      await prisma.booking.findUnique(
        {
          where: {
            id: result.id,
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

            user_booking_technicianIdTouser:
              {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,

                  technicianprofile: {
                    select: {
                      specialties:
                        true,

                      rating:
                        true,

                      totalJobs:
                        true,

                      status:
                        true,

                      certifications:
                        true,
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
            },
          },
        }
      );

    return NextResponse.json(
      {
        success: true,

        bookingId:
          result.id,

        paymentStatus:
          "pending",

        booking:
          createdBooking,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create customer booking error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create booking",
      },
      {
        status: 500,
      }
    );
  }
}
