import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    if (session.role === "HR_DIRECTOR") {
      redirect("/director");
    } else if (session.role === "SYSTEM_ADMIN") {
      redirect("/admin/settings");
    } else if (session.role === "HR_OFFICER") {
      redirect("/hr/requests");
    } else if (session.role === "DEPARTMENT_HEAD") {
      redirect("/manager/requests");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
