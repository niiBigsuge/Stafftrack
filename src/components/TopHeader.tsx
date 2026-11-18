import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

export async function TopHeader() {
  const session = await getSession();
  if (!session) return null;

  let departmentName: string | null = null;
  if (session.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { name: true },
    });
    departmentName = dept?.name || null;
  }

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          StaffTrack Attendance System
        </span>
      </div>

      <div className="flex items-center gap-4">
        <UserProfileDropdown
          session={session}
          departmentName={departmentName}
        />
      </div>
    </header>
  );
}
