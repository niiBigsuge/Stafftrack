import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.HR_ADMIN && session.role !== Role.EXECUTIVE && session.role !== Role.MANAGER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const dateFilter: any = {};
  if (fromParam) dateFilter.gte = new Date(fromParam);
  if (toParam) dateFilter.lte = new Date(toParam);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { recordDate: dateFilter } : {}),
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
      `"${r.user.employeeCode}"`,
      `"${r.user.fullName}"`,
      `"${r.user.department?.name || "General"}"`,
      `"${r.user.jobTitle || ""}"`,
      `"${dateStr}"`,
      `"${inTime}"`,
      `"${outTime}"`,
      `"${r.status}"`,
      r.minutesLate,
      r.isExcused ? "YES" : "NO",
      hours,
      `"${(r.staffRemarks || "").replace(/"/g, '""')}"`,
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
