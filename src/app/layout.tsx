import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "StaffTrack — Corporate Staff Attendance & Punctuality",
  description: "Monitor daily staff attendance, enforce reporting times, and track departmental punctuality benchmarks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
