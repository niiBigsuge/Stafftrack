import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";

export const metadata: Metadata = {
  title: "StaffTrack — Corporate Staff Attendance & Punctuality",
  description: "Monitor daily staff attendance, enforce reporting times, and track departmental punctuality benchmarks.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let departmentName: string | null = null;
  if (session?.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: session.departmentId },
      select: { name: true },
    });
    departmentName = dept?.name || null;
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        {session ? (
          <div className="min-h-screen flex flex-col md:flex-row">
            <Sidebar session={session} departmentName={departmentName} />
            <div className="flex-1 md:pl-64 flex flex-col min-w-0">
              <TopHeader />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
