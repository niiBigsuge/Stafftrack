"use client";

import { useSidebar } from "@/components/SidebarContext";

export function DashboardContainer({
  sidebar,
  topHeader,
  children,
}: {
  sidebar: React.ReactNode;
  topHeader: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {sidebar}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        {topHeader}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
