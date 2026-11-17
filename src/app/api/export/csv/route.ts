import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";

// Sanitize CSV formula injection (=, +, -, @, \t, \r)
function sanitizeCsvCell(val: string | null | undefined): string {
  if (!val) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
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

  // If DEPARTMENT_HEAD, restrict records strictly to own department (Finding M2)
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

  // Generate CSV Header
  const headers = [
    "Employee Code",
    "Full Name",
    "Department",
    "Job Title",
    "Date",
    "Clock In",
    "Clock Out",
    "Status",
    "Minutes Late",
    "Is Excused",
    "Hours Worked",
    "Staff Remarks",
  ];

  const rows = records.map((r) => {
    const hours = r.totalWorkMinutes ? (r.totalWorkMinutes / 60).toFixed(2) : "0.00";
    const inTime = r.clockInTime ? new Date(r.clockInTime).toISOString().substring(11, 19) : "";
    const outTime = r.clockOutTime ? new Date(r.clockOutTime).toISOString().substring(11, 19) : "";
    const dateStr = new Date(r.recordDate).toISOString().split("T")[0];

    return [
      sanitizeCsvCell(r.user.employeeCode),
      sanitizeCsvCell(r.user.fullName),
      sanitizeCsvCell(r.user.department?.name || "General"),
      sanitizeCsvCell(r.user.jobTitle || ""),
      `"${dateStr}"`,
      `"${inTime}"`,
      `"${outTime}"`,
      `"${r.status}"`,
      r.minutesLate,
      r.isExcused ? "YES" : "NO",
      hours,
      sanitizeCsvCell(r.staffRemarks || ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stafftrack-attendance-report-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
