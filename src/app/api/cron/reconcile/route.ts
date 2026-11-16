import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

export async function POST() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch all active users
  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true, employeeCode: true },
  });

  // 2. Fetch existing records for today
  const existingRecords = await prisma.attendanceRecord.findMany({
    where: { recordDate: today },
    select: { userId: true },
  });

  const existingUserIds = new Set(existingRecords.map((r) => r.userId));

  // 3. Filter unrecorded staff
  const unrecordedStaff = activeUsers.filter((u) => !existingUserIds.has(u.id));

  // 4. Insert ABSENT records
  let absentMarkedCount = 0;
  for (const staff of unrecordedStaff) {
    await prisma.attendanceRecord.create({
      data: {
        userId: staff.id,
        recordDate: today,
        status: AttendanceStatus.ABSENT,
        minutesLate: 0,
      },
    });
    absentMarkedCount++;
  }

  // Log reconciliation action
  if (absentMarkedCount > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: activeUsers[0].id, // System action
        action: "AUTOMATED_ABSENCE_RECONCILIATION",
        targetEntity: "AttendanceRecord",
        targetId: today.toISOString(),
        details: JSON.stringify({ count: absentMarkedCount }),
      },
    });
  }

  return NextResponse.json({
    success: true,
    reconciledDate: today.toISOString().split("T")[0],
    absentMarkedCount,
  });
}
