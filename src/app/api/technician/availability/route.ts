import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTechnician, unauthorized } from "@/lib/technician-auth";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function GET(request: NextRequest) {
  try {
    const technician = await getTechnician(request);
    if (!technician) return unauthorized();

    const rows = await prisma.technicianavailability.findMany({
      where: { technicianId: technician.id },
      orderBy: { dayOfWeek: "asc" },
    });

    const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
    return NextResponse.json({
      schedule: days.map((day, index) => {
        const row = byDay.get(index);
        return {
          dayOfWeek: index,
          day,
          enabled: row?.isAvailable ?? index < 6,
          start: row?.startTime ?? (index === 5 ? "09:00" : index === 6 ? "00:00" : "08:00"),
          end: row?.endTime ?? (index === 5 ? "14:00" : index === 6 ? "00:00" : "18:00"),
        };
      }),
    });
  } catch (error) {
    console.error("Technician availability GET error:", error);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const technician = await getTechnician(request);
    if (!technician) return unauthorized();

    const { schedule } = await request.json();
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return NextResponse.json({ error: "A 7-day schedule is required" }, { status: 400 });
    }

    for (const item of schedule) {
      if (!Number.isInteger(item.dayOfWeek) || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        return NextResponse.json({ error: "Invalid dayOfWeek" }, { status: 400 });
      }
      if (item.enabled && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.end))) {
        return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
      }
      if (item.enabled && item.start >= item.end) {
        return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
      }
    }

    await prisma.$transaction(
      schedule.map((item) =>
        prisma.technicianavailability.upsert({
          where: { technicianId_dayOfWeek: { technicianId: technician.id, dayOfWeek: item.dayOfWeek } },
          create: {
            id: crypto.randomUUID(),
            technicianId: technician.id,
            dayOfWeek: item.dayOfWeek,
            isAvailable: Boolean(item.enabled),
            startTime: item.enabled ? item.start : null,
            endTime: item.enabled ? item.end : null,
            updatedAt: new Date(),
          },
          update: {
            isAvailable: Boolean(item.enabled),
            startTime: item.enabled ? item.start : null,
            endTime: item.enabled ? item.end : null,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Technician availability PUT error:", error);
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 });
  }
}
