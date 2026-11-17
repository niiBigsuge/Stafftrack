import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";

// Security Finding: Sanitize CSV/Excel injection characters (=, +, -, @, \t, \r)
function sanitizeExcelCell(val: string | null | undefined): string {
  if (!val) return "";
  const str = String(val).trim();
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== Role.SYSTEM_ADMIN &&
      session.role !== Role.HR_OFFICER &&
      session.role !== Role.HR_DIRECTOR &&
      session.role !== Role.DEPARTMENT_HEAD)
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // If DEPARTMENT_HEAD has no department assigned, prevent org-wide leakage
  if (session.role === Role.DEPARTMENT_HEAD && !session.departmentId) {
    return new NextResponse("Department Head is not assigned to any department.", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const dateFilter: any = {};
  if (fromParam) {
    const fromDate = new Date(fromParam);
    if (!isNaN(fromDate.getTime())) dateFilter.gte = fromDate;
  }
  if (toParam) {
    const toDate = new Date(toParam);
    if (!isNaN(toDate.getTime())) dateFilter.lte = toDate;
  }

  const departmentFilter =
    session.role === Role.DEPARTMENT_HEAD && session.departmentId
      ? { user: { departmentId: session.departmentId } }
      : {};

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { recordDate: dateFilter } : {}),
      ...departmentFilter,
    },
    include: {
      user: {
        include: { department: true },
      },
    },
    orderBy: [{ recordDate: "desc" }, { user: { fullName: "asc" } }],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "StaffTrack Enterprise";
  workbook.lastModifiedBy = session.fullName;
  workbook.created = new Date();

  // --- WORKSHEET 1: Summary Sheet ---
  const summarySheet = workbook.addWorksheet("Punctuality Summary");
  summarySheet.columns = [
    { header: "Department", key: "department", width: 28 },
    { header: "Total Shifts Logged", key: "totalLogs", width: 20 },
    { header: "On-Time Punches", key: "onTimeLogs", width: 18 },
    { header: "Late Punches", key: "lateLogs", width: 16 },
    { header: "Excused Lates", key: "excusedLogs", width: 16 },
    { header: "Total Lateness (Mins)", key: "totalLateMins", width: 22 },
    { header: "Compliance Rate (%)", key: "rate", width: 20 },
  ];

  // Group by department
  const deptMap: Record<string, { total: number; onTime: number; late: number; excused: number; lateMins: number }> = {};
  for (const r of records) {
    const dept = r.user.department?.name || "General";
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, onTime: 0, late: 0, excused: 0, lateMins: 0 };
    }
    deptMap[dept].total++;
    if (r.status === "PRESENT_ON_TIME" || (r.status === "PRESENT_LATE" && r.isExcused) || r.status === "FIELD_DUTY") {
      deptMap[dept].onTime++;
    }
    if (r.status === "PRESENT_LATE") {
      deptMap[dept].late++;
      if (r.isExcused) deptMap[dept].excused++;
      deptMap[dept].lateMins += r.minutesLate;
    }
  }

  for (const [deptName, d] of Object.entries(deptMap)) {
    const rate = d.total > 0 ? Math.round((d.onTime / d.total) * 100) : 100;
    summarySheet.addRow({
      department: sanitizeExcelCell(deptName),
      totalLogs: d.total,
      onTimeLogs: d.onTime,
      lateLogs: d.late,
      excusedLogs: d.excused,
      totalLateMins: d.lateMins,
      rate: `${rate}%`,
    });
  }

  // --- WORKSHEET 2: Detail Sheet ---
  const detailSheet = workbook.addWorksheet("Attendance Logs");
  detailSheet.columns = [
    { header: "Employee Code", key: "employeeCode", width: 18 },
    { header: "Full Name", key: "fullName", width: 26 },
    { header: "Department", key: "department", width: 24 },
    { header: "Job Title", key: "jobTitle", width: 22 },
    { header: "Record Date", key: "recordDate", width: 14 },
    { header: "Clock In (GMT)", key: "clockIn", width: 16 },
    { header: "Clock Out (GMT)", key: "clockOut", width: 16 },
    { header: "Status", key: "status", width: 20 },
    { header: "Minutes Late", key: "minutesLate", width: 14 },
    { header: "Is Excused", key: "isExcused", width: 12 },
    { header: "Hours Worked", key: "hoursWorked", width: 14 },
    { header: "Remarks", key: "remarks", width: 30 },
  ];

  for (const r of records) {
    const hours = r.totalWorkMinutes ? Number((r.totalWorkMinutes / 60).toFixed(2)) : 0;
    const inTime = r.clockInTime ? new Date(r.clockInTime).toISOString().substring(11, 19) : "";
    const outTime = r.clockOutTime ? new Date(r.clockOutTime).toISOString().substring(11, 19) : "";
    const dateStr = new Date(r.recordDate).toISOString().split("T")[0];

    detailSheet.addRow({
      employeeCode: sanitizeExcelCell(r.user.employeeCode),
      fullName: sanitizeExcelCell(r.user.fullName),
      department: sanitizeExcelCell(r.user.department?.name || "General"),
      jobTitle: sanitizeExcelCell(r.user.jobTitle || ""),
      recordDate: dateStr,
      clockIn: inTime,
      clockOut: outTime,
      status: r.status,
      minutesLate: r.minutesLate,
      isExcused: r.isExcused ? "YES" : "NO",
      hoursWorked: hours,
      remarks: sanitizeExcelCell(r.staffRemarks || ""),
    });
  }

  // Style header row in detail sheet
  detailSheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stafftrack-attendance-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
