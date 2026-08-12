import type { Property } from "@prisma/client";
import type { ActiveUser } from "@/lib/auth-session";

/** Hide villa contact phone from employees until their booking is approved (business rule 6.3). */
export function sanitizePropertyForUser<T extends Pick<Property, "contactPhone">>(
  property: T,
  user: ActiveUser
): T {
  if (user.role === "admin") return property;
  return { ...property, contactPhone: "" };
}
