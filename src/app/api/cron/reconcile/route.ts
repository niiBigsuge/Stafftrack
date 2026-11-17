import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AttendanceStatus, RequestStatus, RequestType, Role } from "@prisma/client";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // 1. Authorization Gate (Finding H1): Require Bearer CRON_SECRET or an active SYSTEM_ADMIN/HR_OFFICER session
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  let isBearerAuthorized = false;

  if (cronSecret && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(cronSecret);
    if (tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf)) {
      isBearerAuthorized = true;
    }
  }

  const session = await getSession();
  const isSessionAuthorized =
    session && (session.role === Role.SYSTEM_ADMIN || session.role === Role.HR_OFFICER);

  if (!isBearerAuthorized && !isSessionAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Missing valid bearer token or authorized session." },
      { status: 401 }
    );
  }

  // 2. Determine target date strictly in GMT (UTC)
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 3. Working Days Check (Skip weekends unless configured)
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    return NextResponse.json({
      success: true,
      message: "Weekend detected. Absence reconciliation skipped for non-working day.",
      reconciledDate: todayUtc.toISOString().split("T")[0],
      reconciledCount: 0,
    });
  }

  // 4. Fetch all active users who are required to report attendance (Exclude SYSTEM_ADMIN)
  const activeStaff = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { not: Role.SYSTEM_ADMIN },
    },
    select: { id: true, fullName: true, employeeCode: true },
  });

  // 5. Query existing attendance records for today
  const existingRecords = await prisma.attendanceRecord.findMany({
    where: { recordDate: todayUtc },
    select: { userId: true },
  });
  const existingUserIds = new Set(existingRecords.map((r) => r.userId));

  // 6. Identify unrecorded staff members
  const unrecordedStaff = activeStaff.filter((u) => !existingUserIds.has(u.id));

  // 7. Query approved leave and field assignment requests active today
  const approvedRequests = await prisma.attendanceRequest.findMany({
    where: {
      status: RequestStatus.APPROVED,
      requestType: { in: [RequestType.LEAVE_NOTICE, RequestType.FIELD_ASSIGNMENT] },
      OR: [
        {
          startDate: { lte: todayUtc },
          endDate: { gte: todayUtc },
        },
        {
          requestedDate: todayUtc,
        },
      ],
    },
    select: {
      userId: true,
      requestType: true,
      reason: true,
    },
  });

  const requestMap = new Map<string, { requestType: RequestType; reason: string }>();
  for (const reqItem of approvedRequests) {
    requestMap.set(reqItem.userId, { requestType: reqItem.requestType, reason: reqItem.reason });
  }

  // 8. Reconcile records with strict priority: LEAVE -> FIELD DUTY -> ABSENT
  let countLeave = 0;
  let countField = 0;
  let countAbsent = 0;

  for (const staff of unrecordedStaff) {
    const approvedDuty = requestMap.get(staff.id);

    let statusToAssign: AttendanceStatus = AttendanceStatus.ABSENT;
    let remarks: string | null = null;

    if (approvedDuty) {
      if (approvedDuty.requestType === RequestType.LEAVE_NOTICE) {
        statusToAssign = AttendanceStatus.ON_LEAVE;
        remarks = `Approved Leave: ${approvedDuty.reason}`;
        countLeave++;
      } else if (approvedDuty.requestType === RequestType.FIELD_ASSIGNMENT) {
        statusToAssign = AttendanceStatus.FIELD_DUTY;
        remarks = `Official Field Duty: ${approvedDuty.reason}`;
        countField++;
      }
    } else {
      statusToAssign = AttendanceStatus.ABSENT;
      countAbsent++;
    }

    await prisma.attendanceRecord.create({
      data: {
        userId: staff.id,
        recordDate: todayUtc,
        status: statusToAssign,
        minutesLate: 0,
        isExcused: statusToAssign !== AttendanceStatus.ABSENT,
        staffRemarks: remarks,
      },
    });
  }

  const totalReconciled = countLeave + countField + countAbsent;

  // 9. Immutable Audit Trail
  const actorId = session?.userId || activeStaff[0]?.id || "system";
  if (totalReconciled > 0) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "AUTOMATED_ABSENCE_RECONCILIATION",
        targetEntity: "AttendanceRecord",
        targetId: todayUtc.toISOString().split("T")[0],
        details: JSON.stringify({
          totalReconciled,
          countAbsent,
          countLeave,
          countField,
          executedBy: session ? session.email : "CRON_BEARER",
        }),
      },
    });
  }

  return NextResponse.json({
    success: true,
    reconciledDate: todayUtc.toISOString().split("T")[0],
    totalReconciled,
    countAbsent,
    countLeave,
    countField,
  });
}
