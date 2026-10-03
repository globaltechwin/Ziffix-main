import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: "technician",
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        technicianprofile: {
          select: {
            id: true,
            userId: true,
            specialties: true,
            certifications: true,
            rating: true,
            totalJobs: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedTechnicians = technicians.map((technician) => ({
      id: technician.id,
      phone: technician.phone,
      name: technician.name || "Technician",
      email: technician.email,
      role: technician.role,
      createdAt: technician.createdAt,

      // Convert Prisma's lowercase relation name
      // to the camelCase name expected by the frontend.
      technicianProfile: technician.technicianprofile
        ? {
            id: technician.technicianprofile.id,
            userId: technician.technicianprofile.userId,

            specialties: technician.technicianprofile.specialties
              ? technician.technicianprofile.specialties
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],

            certifications: technician.technicianprofile.certifications
              ? technician.technicianprofile.certifications
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],

            rating: technician.technicianprofile.rating,
            totalJobs: technician.technicianprofile.totalJobs,
            status: technician.technicianprofile.status,

            createdAt: technician.technicianprofile.createdAt,
            updatedAt: technician.technicianprofile.updatedAt,
          }
        : null,
    }));

    return NextResponse.json({
      technicians: formattedTechnicians,
    });
  } catch (error) {
    console.error("List technicians error:", error);

    return NextResponse.json(
      {
        error: "Failed to load technicians",
      },
      {
        status: 500,
      }
    );
  }
}