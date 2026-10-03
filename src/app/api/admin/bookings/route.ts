import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

function isAdmin(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  return getAdminFromSession(sessionCookie);
}

function notificationId() {
  return randomUUID();
}

/* =========================================================
   GET ALL BOOKINGS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const adminId = isAdmin(request);

    if (!adminId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const bookings = await prisma.booking.findMany({
      include: {
        user_booking_customerIdTouser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
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

        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            transactionId: true,
          },
        },

        bookingitem: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedBookings = bookings.map((booking) => ({
  ...booking,

  // Keep the Prisma relation because the Admin page uses it.
  user_booking_customerIdTouser:
    booking.user_booking_customerIdTouser,

  user_booking_technicianIdTouser:
    booking.user_booking_technicianIdTouser,

  // Also expose simple aliases for other portal pages/APIs.
  customer: booking.user_booking_customerIdTouser,

  technician: booking.user_booking_technicianIdTouser,
}));

return NextResponse.json({
  bookings: formattedBookings,
});
  } catch (error) {
    console.error("List admin bookings error:", error);

    return NextResponse.json(
      {
        error: "Failed to list bookings",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   CREATE BOOKING FROM ADMIN
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const adminId = isAdmin(request);

    if (!adminId) {
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
      customerId,
      technicianId,
      serviceId,
      scheduledDate,
      scheduledTime,
      address,
      notes,
      totalAmount,
    } = body;

    if (
      !customerId ||
      !serviceId ||
      !scheduledDate ||
      !scheduledTime ||
      !address ||
      totalAmount === undefined
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        },
      );
    }

    const [customer, service] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: customerId,
        },
      }),

      prisma.service.findUnique({
        where: {
          id: serviceId,
        },
      }),
    ]);

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found",
        },
        {
          status: 404,
        },
      );
    }

    if (customer.role !== "customer") {
      return NextResponse.json(
        {
          error: "Selected user is not a customer",
        },
        {
          status: 400,
        },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          error: "Service not found",
        },
        {
          status: 404,
        },
      );
    }

    let technician = null;

    if (technicianId) {
      technician = await prisma.user.findUnique({
        where: {
          id: technicianId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          technicianprofile: {
            select: {
              specialties: true,
              rating: true,
              status: true,
            },
          },
        },
      });

      if (
        !technician ||
        technician.role !== "technician" ||
        !technician.technicianprofile
      ) {
        return NextResponse.json(
          {
            error: "Invalid technician",
          },
          {
            status: 400,
          },
        );
      }
    }

    const bookingId = randomUUID();

    const booking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          id: bookingId,
          customerId,
          technicianId: technicianId || null,
          serviceId,
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          address: String(address).trim(),
          notes:
            typeof notes === "string" && notes.trim()
              ? notes.trim()
              : null,
          totalAmount: Number(totalAmount),
          status: "pending",
          updatedAt: new Date(),
        },
      });

      if (technicianId && technician) {
        await tx.notification.create({
          data: {
            id: notificationId(),
            userId: technicianId,
            title: "New Job Assigned",
            message: `${service.name} has been assigned to you. Booking ${bookingId}.`,
            type: "booking",
          },
        });

        await tx.notification.create({
          data: {
            id: notificationId(),
            userId: customerId,
            title: "Technician Assigned",
            message: `${technician.name || "A technician"} has been assigned to your ${service.name} booking.`,
            type: "booking",
          },
        });
      }

      return createdBooking;
    });

    const completeBooking = await prisma.booking.findUnique({
      where: {
        id: booking.id,
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

        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            transactionId: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        booking: completeBooking
          ? {
              ...completeBooking,
              customer:
                completeBooking.user_booking_customerIdTouser,
              technician:
                completeBooking.user_booking_technicianIdTouser,
            }
          : booking,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create admin booking error:", error);

    return NextResponse.json(
      {
        error: "Failed to create booking",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   UPDATE BOOKING
   - status
   - technician assignment
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const adminId = isAdmin(request);

    if (!adminId) {
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
      bookingId,
      status,
      technicianId,
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        {
          error: "bookingId is required",
        },
        {
          status: 400,
        },
      );
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid booking status",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Find the current booking first.
     * We need the old technician ID so we can detect:
     *
     * old technician -> new technician
     * no technician  -> new technician
     * technician     -> no technician
     */
    const existingBooking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },

      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },

        user_booking_customerIdTouser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
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
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Validate technician whenever technicianId is being changed.
     */
    let newTechnician = null;

    if (
      technicianId !== undefined &&
      technicianId !== null &&
      technicianId !== ""
    ) {
      newTechnician = await prisma.user.findUnique({
        where: {
          id: technicianId,
        },

        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          technicianprofile: {
            select: {
              specialties: true,
              rating: true,
              status: true,
              certifications: true,
            },
          },
        },
      });

      if (
        !newTechnician ||
        newTechnician.role !== "technician" ||
        !newTechnician.technicianprofile
      ) {
        return NextResponse.json(
          {
            error: "Invalid technician",
          },
          {
            status: 400,
          },
        );
      }
    }

    const oldTechnicianId =
      existingBooking.technicianId;

    const requestedTechnicianId =
      technicianId === undefined
        ? oldTechnicianId
        : technicianId || null;

    const technicianChanged =
      technicianId !== undefined &&
      requestedTechnicianId !== oldTechnicianId;

    const statusChanged =
      status !== undefined &&
      status !== existingBooking.status;

    /*
     * Don't allow an already completed booking to be
     * moved backward by accident.
     */
    if (
      statusChanged &&
      existingBooking.status === "completed" &&
      status !== "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Completed bookings cannot be moved back to another status",
        },
        {
          status: 400,
        },
      );
    }

    const updatedBooking =
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.update({
          where: {
            id: bookingId,
          },

          data: {
            ...(status !== undefined
              ? {
                  status,
                }
              : {}),

            ...(technicianId !== undefined
              ? {
                  technicianId:
                    technicianId || null,
                }
              : {}),

            updatedAt: new Date(),
          },
        });

        /*
         * =====================================================
         * TECHNICIAN ASSIGNMENT
         * =====================================================
         */

        if (technicianChanged) {
          /*
           * Notify the old technician when the job is
           * reassigned or removed.
           */
          if (oldTechnicianId) {
            if (requestedTechnicianId) {
              await tx.notification.create({
                data: {
                  id: notificationId(),
                  userId: oldTechnicianId,
                  title: "Job Reassigned",
                  message: `Booking ${bookingId} for ${existingBooking.service.name} has been reassigned to another technician.`,
                  type: "booking",
                },
              });
            } else {
              await tx.notification.create({
                data: {
                  id: notificationId(),
                  userId: oldTechnicianId,
                  title: "Job Unassigned",
                  message: `Booking ${bookingId} for ${existingBooking.service.name} is no longer assigned to you.`,
                  type: "booking",
                },
              });
            }
          }

          /*
           * Notify the new technician.
           */
          if (
            requestedTechnicianId &&
            newTechnician
          ) {
            await tx.notification.create({
              data: {
                id: notificationId(),
                userId: requestedTechnicianId,
                title:
                  oldTechnicianId
                    ? "Job Reassigned"
                    : "New Job Assigned",
                message: `${existingBooking.service.name} has been assigned to you. Booking ${bookingId}.`,
                type: "booking",
              },
            });
          }

          /*
           * Notify customer about assignment change.
           */
          if (
            requestedTechnicianId &&
            newTechnician
          ) {
            await tx.notification.create({
              data: {
                id: notificationId(),
                userId: existingBooking.customerId,
                title: "Technician Assigned",
                message: `${newTechnician.name || "A technician"} has been assigned to your ${existingBooking.service.name} booking.`,
                type: "booking",
              },
            });
          } else if (oldTechnicianId) {
            await tx.notification.create({
              data: {
                id: notificationId(),
                userId: existingBooking.customerId,
                title: "Technician Unassigned",
                message: `The technician assignment for your ${existingBooking.service.name} booking has been removed.`,
                type: "booking",
              },
            });
          }
        }

        /*
         * =====================================================
         * STATUS CHANGE
         * =====================================================
         */

        if (statusChanged) {
          const readableStatus =
            String(status)
              .replaceAll("_", " ")
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase(),
              );

          /*
           * Customer notification.
           */
          await tx.notification.create({
            data: {
              id: notificationId(),
              userId: existingBooking.customerId,
              title: "Booking Status Updated",
              message: `Your ${existingBooking.service.name} booking ${bookingId} is now ${readableStatus}.`,
              type: "booking",
            },
          });

          /*
           * If Admin changes the status while a technician
           * is assigned, also notify the technician.
           */
          if (existingBooking.technicianId) {
            await tx.notification.create({
              data: {
                id: notificationId(),
                userId: existingBooking.technicianId,
                title: "Booking Status Updated",
                message: `Booking ${bookingId} for ${existingBooking.service.name} is now ${readableStatus}.`,
                type: "booking",
              },
            });
          }
        }

        return booking;
      });

    /*
     * Return the complete booking so the Admin UI can update
     * immediately without needing a second manual action.
     */
    const completeBooking =
      await prisma.booking.findUnique({
        where: {
          id: updatedBooking.id,
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

          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              transactionId: true,
            },
          },

          bookingitem: true,
        },
      });

    return NextResponse.json({
      booking: completeBooking
        ? {
            ...completeBooking,
            customer:
              completeBooking.user_booking_customerIdTouser,
            technician:
              completeBooking.user_booking_technicianIdTouser,
          }
        : updatedBooking,
    });
  } catch (error) {
    console.error("Update admin booking error:", error);

    return NextResponse.json(
      {
        error: "Failed to update booking",
      },
      {
        status: 500,
      },
    );
  }
}
