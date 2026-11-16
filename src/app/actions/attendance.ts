"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/session";
import { evaluatePunchPunctuality, calculateWorkDurationMinutes } from "@/lib/punctuality";
import { AttendanceStatus, RequestType, RequestStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function clockIn(remarks?: string) {
  const session = await requireAuth();
  const now = new Date();

  // Normalize today's date to midnight UTC/local
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Verify duplicate clock-in
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      userId_recordDate: {
        userId: session.userId,
        recordDate: today,
      },
    },
  });

  if (existing && existing.clockInTime) {
    return { error: "You have already clocked in for today." };
  }

  // Fetch company policy
  let policy = await prisma.companyPolicy.findFirst();
  if (!policy) {
    policy = {
      id: "default-policy",
      workStartTime: "08:30:00",
      workEndTime: "17:00:00",
      graceMinutes: 15,
      workingDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
      updatedAt: new Date(),
    };
  }

  const punctuality = evaluatePunchPunctuality(now, {
    workStartTime: policy.workStartTime,
    workEndTime: policy.workEndTime,
    graceMinutes: policy.graceMinutes,
  });

  let record;
  if (existing) {
    // Update existing placeholder (e.g. if created ahead of time)
    record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        clockInTime: now,
        status: punctuality.status,
        minutesLate: punctuality.minutesLate,
        staffRemarks: remarks || null,
      },
    });
  } else {
    record = await prisma.attendanceRecord.create({
      data: {
        userId: session.userId,
        recordDate: today,
        clockInTime: now,
        status: punctuality.status,
        minutesLate: punctuality.minutesLate,
        staffRemarks: remarks || null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/live-board");
  revalidatePath("/ceo");
  revalidatePath("/admin/reports");

  return {
    success: true,
    recordId: record.id,
    clockInTime: record.clockInTime,
    status: punctuality.status,
    minutesLate: punctuality.minutesLate,
  };
}

export async function clockOut() {
  const session = await requireAuth();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      userId_recordDate: {
        userId: session.userId,
        recordDate: today,
      },
    },
  });

  if (!record || !record.clockInTime) {
    return { error: "No active clock-in found for today. Please clock in first." };
  }

  if (record.clockOutTime) {
    return { error: "You have already clocked out for today." };
  }

  const duration = calculateWorkDurationMinutes(record.clockInTime, now);

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutTime: now,
      totalWorkMinutes: duration,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/live-board");
  revalidatePath("/ceo");
  revalidatePath("/admin/reports");

  return {
    success: true,
    recordId: updated.id,
    clockOutTime: updated.clockOutTime,
    durationMinutes: duration,
  };
}

export async function submitAttendanceRequest(formData: FormData) {
  const session = await requireAuth();

  const recordId = (formData.get("recordId") as string) || null;
  const requestType = formData.get("requestType") as RequestType;
  const dateStr = formData.get("requestedDate") as string;
  const proposedTimeStr = formData.get("proposedTime") as string;
  const reason = formData.get("reason") as string;

  if (!reason || reason.trim().length < 5) {
    return { error: "Please provide a detailed justification (minimum 5 characters)." };
  }

  const requestedDate = new Date(dateStr);
  let proposedTime: Date | null = null;
  if (proposedTimeStr) {
    proposedTime = new Date(proposedTimeStr);
  }

  await prisma.attendanceRequest.create({
    data: {
      userId: session.userId,
      recordId: recordId || undefined,
      requestType,
      requestedDate,
      proposedTime,
      reason: reason.trim(),
      status: RequestStatus.PENDING,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/manager/requests");

  return { success: true };
}

export async function reviewAttendanceRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerNote?: string
) {
  const reviewer = await requireRole([Role.SUPER_ADMIN, Role.MANAGER, Role.HR_ADMIN]);

  const request = await prisma.attendanceRequest.findUnique({
    where: { id: requestId },
    include: { record: true, user: true },
  });

  if (!request) {
    return { error: "Request not found." };
  }

  if (request.status !== RequestStatus.PENDING) {
    return { error: "This request has already been reviewed." };
  }

  const newStatus = decision === "APPROVED" ? RequestStatus.APPROVED : RequestStatus.REJECTED;

  // Update request record
  await prisma.attendanceRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      reviewerId: reviewer.userId,
      reviewerNote: reviewerNote || null,
      reviewedAt: new Date(),
    },
  });

  // If approved and was an excuse for lateness, excuse the linked attendance record
  if (decision === "APPROVED" && request.recordId && request.requestType === RequestType.LATE_EXCUSE) {
    await prisma.attendanceRecord.update({
      where: { id: request.recordId },
      data: { isExcused: true },
    });
  }

  // Create immutable audit log
  await prisma.auditLog.create({
    data: {
      actorId: reviewer.userId,
      action: `ATTENDANCE_REQUEST_${decision}`,
      targetEntity: "AttendanceRequest",
      targetId: requestId,
      details: JSON.stringify({
        applicant: request.user.fullName,
        applicantCode: request.user.employeeCode,
        requestType: request.requestType,
        decision,
        reviewerNote: reviewerNote || "",
      }),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/hr/requests");
  revalidatePath("/manager/requests");
  revalidatePath("/admin/live-board");

  return { success: true };
}
