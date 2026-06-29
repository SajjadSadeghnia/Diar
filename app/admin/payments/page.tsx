import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { getBookingDisplayStatus } from "@/lib/booking-utils";
import { toJalaliDate } from "@/lib/utils";
import { EmployeeInfo } from "@/components/employee-info";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toToman } from "@/lib/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function reviewPayment(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const paymentStatus = String(formData.get("paymentStatus")) as "approved" | "rejected";
  const bookingStatus = paymentStatus === "approved" ? "approved" : "rejected";

  const payment = await prisma.payment.update({ where: { id }, data: { status: paymentStatus } });
  await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: bookingStatus } });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");
}

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const payments = await prisma.payment.findMany({
    include: { booking: { include: { user: true, property: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4">
        {payments.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{p.booking.property.title}</h3>
              <StatusBadge status={getBookingDisplayStatus(p.booking)} />
            </div>
            <EmployeeInfo name={p.booking.user.name} phone={p.booking.user.phone} className="mt-2" />
            <p className="mt-1 text-sm text-slate-600">
              بازه رزرو: {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
            </p>
            <p className="mt-2 text-sm">مبلغ: {toToman(p.amount)}</p>
            <Image src={p.receiptPath} alt="رسید" width={360} height={180} className="mt-3 rounded-lg border" />
            <form action={reviewPayment} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={p.id} />
              <button className="btn-primary" name="paymentStatus" value="approved">تایید پرداخت</button>
              <button className="btn-danger" name="paymentStatus" value="rejected">رد پرداخت</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
