import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { SidebarProvider } from "@/components/SidebarContext";
import { DashboardContainer } from "@/components/DashboardContainer";

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
          <SidebarProvider>
            <DashboardContainer
              sidebar={<Sidebar session={session} departmentName={departmentName} />}
              topHeader={<TopHeader />}
            >
              {children}
            </DashboardContainer>
          </SidebarProvider>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
