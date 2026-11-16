import { redirect } from "next/navigation";

export default function ManagerRequestsRedirect() {
  redirect("/hr/requests");
}
