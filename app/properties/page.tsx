import { redirect } from "next/navigation";

export default function PropertiesPage() {
  // Redirect to homepage since we now have only one property
  redirect("/");
}
