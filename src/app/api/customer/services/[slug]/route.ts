import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        servicevariant: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          error: "Service not found",
        },
        {
          status: 404,
        }
      );
    }

    const serviceWithVariants = {
      ...service,
      variants: service.servicevariant,
    };

    return NextResponse.json({
      service: serviceWithVariants,
    });
  } catch (error) {
    console.error("Failed to load customer service:", error);

    return NextResponse.json(
      {
        error: "Failed to load service",
      },
      {
        status: 500,
      }
    );
  }
}