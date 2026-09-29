import { Settings } from "lucide-react";
import { AdminPaymentSettingsModal } from "@/components/admin-payment-settings-modal";
import { AdminContactSettingsModal } from "@/components/admin-contact-settings-modal";

interface AdminSettingsProps {
  cardNumber: string;
  instructions: string;
  contactPhone: string;
  contactInfo: string;
}

export function AdminSettings({ cardNumber, instructions, contactPhone, contactInfo }: AdminSettingsProps) {
  return (
    <>
      <section className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Settings className="h-5 w-5 text-ink" />
            تنظیمات پرداخت
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">مدیریت کارت بانکی و دستورالعمل‌های پرداخت برای کارمندان</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-charcoal-muted/70">شماره کارت فعلی:</p>
            <p className="font-medium text-ink">{cardNumber || "تنظیم نشده"}</p>
          </div>
          <AdminPaymentSettingsModal initialCardNumber={cardNumber} initialInstructions={instructions} />
        </div>
      </section>

      <section className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Settings className="h-5 w-5 text-ink" />
            اطلاعات تماس
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">شماره تماس و عنوان بخش «تماس با ما» در فوتر سایت</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-charcoal-muted/70">شماره تماس فعلی:</p>
            <p className="font-medium text-ink" dir="ltr">
              {contactPhone || "تنظیم نشده"}
            </p>
          </div>
          <AdminContactSettingsModal initialContactPhone={contactPhone} initialContactInfo={contactInfo} />
        </div>
      </section>
    </>
  );
}
