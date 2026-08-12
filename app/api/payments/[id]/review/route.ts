import { requireAdminUser } from "@/lib/auth-session";
import { reviewPaymentById } from "@/lib/payment-review";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const paymentStatus = body.paymentStatus ?? body.status;
  if (!["approved", "rejected"].includes(paymentStatus)) {
    return NextResponse.json({ error: "وضعیت پرداخت نامعتبر است" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const result = await reviewPaymentById({
      adminId: auth.user.userId,
      paymentId: id,
      paymentStatus,
      req,
    });

    return NextResponse.json({ message: "به روزرسانی شد", ...result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
