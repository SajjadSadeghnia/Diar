"use server";

import { requireAdminAction } from "@/lib/auth-session";
import { reviewPaymentById } from "@/lib/payment-review";
import { revalidatePath } from "next/cache";

export async function reviewPaymentForm(formData: FormData) {
  const admin = await requireAdminAction();
  const id = String(formData.get("id"));
  const paymentStatus = String(formData.get("paymentStatus")) as "approved" | "rejected";

  try {
    await reviewPaymentById({ adminId: admin.userId, paymentId: id, paymentStatus });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "خطا در بررسی پرداخت");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");
  revalidatePath("/");
}
