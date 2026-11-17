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
      graceMinutes: 5,
      workingDays: JSON.stringify(["MON", "TUE", "WED", "THU", "FRI"]),
      timezone: "GMT",
      hrContactPhone: "+233 20 000 0000",
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
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const proposedTimeStr = formData.get("proposedTime") as string;
  const reason = formData.get("reason") as string;

  if (!reason || reason.trim().length < 5) {
    return { error: "Please provide a detailed justification (minimum 5 characters)." };
  }

  // Security finding M1: Verify recordId belongs to current session user if provided
  if (recordId) {
    const linkedRecord = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      select: { userId: true },
    });
    if (!linkedRecord || linkedRecord.userId !== session.userId) {
      return { error: "Unauthorized access to the specified attendance record." };
    }
  }

  let requestedDate: Date | null = dateStr ? new Date(dateStr) : null;
  let startDate: Date | null = startDateStr ? new Date(startDateStr) : null;
  let endDate: Date | null = endDateStr ? new Date(endDateStr) : null;

  if ((requestType === "LEAVE_NOTICE" || requestType === "FIELD_ASSIGNMENT") && (!startDate || !endDate)) {
    return { error: "Please provide both start and end dates." };
  }

  if (startDate && endDate && startDate > endDate) {
    return { error: "Start date cannot be after end date." };
  }

  let proposedTime: Date | null = null;
  if (proposedTimeStr) {
    proposedTime = new Date(proposedTimeStr);
  }

  await prisma.attendanceRequest.create({
    data: {
      userId: session.userId,
      recordId: recordId || undefined,
      requestType,
      requestedDate: requestedDate || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      proposedTime,
      reason: reason.trim(),
      status: RequestStatus.PENDING,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/hr/requests");
  revalidatePath("/manager/requests");

  return { success: true };
}

export async function reviewAttendanceRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerNote?: string
) {
  const reviewer = await requireRole([
    Role.SYSTEM_ADMIN,
    Role.HR_DIRECTOR,
    Role.HR_OFFICER,
    Role.DEPARTMENT_HEAD,
  ]);

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

  // Self-approval prevention
  if (request.userId === reviewer.userId) {
    return { error: "Reviewers are not permitted to approve or reject their own requests." };
  }

  // Security finding M2: Scoping for DEPARTMENT_HEAD
  if (reviewer.role === Role.DEPARTMENT_HEAD) {
    if (!reviewer.departmentId || request.user.departmentId !== reviewer.departmentId) {
      return { error: "You are only permitted to review requests for members of your own department." };
    }
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

  // If approved, handle adjustment side-effects
  if (decision === "APPROVED") {
    if (request.recordId && request.requestType === RequestType.LATE_EXCUSE) {
      await prisma.attendanceRecord.update({
        where: { id: request.recordId },
        data: { isExcused: true },
      });
    } else if (request.recordId && request.requestType === RequestType.MISSING_CLOCK_IN && request.proposedTime) {
      await prisma.attendanceRecord.update({
        where: { id: request.recordId },
        data: { clockInTime: request.proposedTime },
      });
    } else if (request.recordId && request.requestType === RequestType.MISSING_CLOCK_OUT && request.proposedTime) {
      await prisma.attendanceRecord.update({
        where: { id: request.recordId },
        data: { clockOutTime: request.proposedTime },
      });
    }
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
