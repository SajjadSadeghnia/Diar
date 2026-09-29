import Image from "next/image";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { EmployeeInfo } from "@/components/employee-info";
import { StatusBadge } from "@/components/status-badge";
import { reviewPaymentForm } from "@/lib/admin-payment-actions";
import { toSecureReceiptUrl } from "@/lib/receipt-url";
import { toJalaliDate, toToman } from "@/lib/utils";

interface PendingPayment {
  id: string;
  amount: number;
  createdAt: Date;
  receiptPath: string;
  booking: {
    property: { title: string; contactPhone: string };
    user: { name: string; phone: string | null };
    startDate: Date;
    endDate: Date;
  };
}

interface PendingPaymentsSectionProps {
  payments: PendingPayment[];
}

export function PendingPaymentsSection({ payments }: PendingPaymentsSectionProps) {
  return (
    <section className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
          <Clock className="h-5 w-5 text-ink" />
          رسیدها و تایید رزروهای در انتظار
        </h2>
        <p className="mt-2 text-sm text-charcoal-muted">اطلاعات رزرو، کارمند و رسید واریز را بررسی و تایید/رد کنید.</p>
      </div>

      <div className="space-y-6">
        {payments.map((p) => (
          <div
            key={p.id}
            className="card-hover rounded-xl border border-line/80 bg-canvas-raised p-6 transition-all duration-300 hover:shadow-lg hover:border-ink/15"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">{p.booking.property.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <StatusBadge status="awaiting_admin_review" size="md" />
                  <span className="text-sm text-charcoal-muted">{toJalaliDate(p.createdAt)}</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-ink">{toToman(p.amount)}</p>
                <p className="text-xs text-charcoal-muted">مبلغ پرداخت</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <EmployeeInfo name={p.booking.user.name} phone={p.booking.user.phone} />
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-ink">ملک:</span> {p.booking.property.title}
                </p>
                <p>
                  <span className="font-medium text-ink">بازه رزرو:</span>{" "}
                  {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
                </p>
                <p>
                  <span className="font-medium text-ink">تماس پشتیبانی ملک:</span> {p.booking.property.contactPhone}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-ink mb-2">رسید واریزی:</p>
              <div className="rounded-lg border border-line overflow-hidden">
                <Image
                  src={toSecureReceiptUrl(p.receiptPath)}
                  alt="رسید واریزی"
                  width={600}
                  height={200}
                  unoptimized
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            <form action={reviewPaymentForm} className="flex flex-wrap gap-3">
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                name="paymentStatus"
                value="approved"
                className="btn-primary flex items-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4" />
                تایید رزرو
              </button>
              <button
                type="submit"
                name="paymentStatus"
                value="rejected"
                className="btn-danger flex items-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <XCircle className="h-4 w-4" />
                رد رزرو
              </button>
            </form>
          </div>
        ))}

        {!payments.length && (
          <div className="empty-state">
            <span className="mb-3 rounded-2xl bg-canvas p-3 text-charcoal-muted/50">
              <Clock className="h-6 w-6" />
            </span>
            <p className="font-medium text-charcoal-muted">در حال حاضر پرداخت در انتظار تایید وجود ندارد.</p>
            <p className="mt-2 text-sm text-charcoal-muted/60">همه پرداخت‌ها بررسی شده‌اند</p>
          </div>
        )}
      </div>
    </section>
  );
}
