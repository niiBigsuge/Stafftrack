import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    if (session.role === "EXECUTIVE") {
      redirect("/ceo");
    } else if (session.role === "SUPER_ADMIN") {
      redirect("/admin/settings");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
