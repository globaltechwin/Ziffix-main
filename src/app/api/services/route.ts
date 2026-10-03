import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(category && category !== "All"
          ? { category }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { category: { contains: query } },
                { description: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: [{ totalBookings: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
