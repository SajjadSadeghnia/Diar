import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { toSecureReceiptUrl } from "@/lib/receipt-url";
import { toJalaliDate, toToman } from "@/lib/utils";

interface HistoryPayment {
  id: string;
  amount: number;
  status: string;
  receiptPath: string;
  booking: {
    status: string;
    startDate: Date;
    endDate: Date;
    property: { title: string };
    user: { name: string; phone: string | null };
  };
}

interface PaymentsHistoryTableProps {
  payments: HistoryPayment[];
}

export function PaymentsHistoryTable({ payments }: PaymentsHistoryTableProps) {
  return (
    <section className="card">
      <h2 className="text-lg font-bold text-ink">آرشیو کامل پرداخت‌ها و رزروها</h2>
      <p className="mt-1 text-sm text-charcoal-muted">در این بخش تمام سوابق قبلی (تایید/رد/درانتظار) همیشه قابل مشاهده است.</p>

      {payments.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>کارمند</th>
                <th>ملک</th>
                <th>بازه</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
                <th>فیش</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p>{p.booking.user.name}</p>
                    <p className="text-xs text-charcoal-muted" dir="ltr">
                      {p.booking.user.phone || "—"}
                    </p>
                  </td>
                  <td>{p.booking.property.title}</td>
                  <td>
                    {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
                  </td>
                  <td>{toToman(p.amount)}</td>
                  <td className="space-y-1">
                    <StatusBadge status={p.booking.status} />
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <Link href={toSecureReceiptUrl(p.receiptPath)} target="_blank" className="font-semibold text-ink">
                      مشاهده فیش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state mt-4">
          <p className="font-medium text-charcoal-muted">هنوز سابقه‌ای ثبت نشده است.</p>
        </div>
      )}
    </section>
  );
}
