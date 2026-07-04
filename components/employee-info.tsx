type EmployeeInfoProps = {
  name: string;
  phone?: string | null;
  className?: string;
};

export function EmployeeInfo({ name, phone, className = "" }: EmployeeInfoProps) {
  return (
    <div className={`space-y-1 text-sm ${className}`}>
      <p>
        <span className="font-medium text-ink">نام کارمند:</span>{" "}
        <span className="text-charcoal-muted">{name}</span>
      </p>
      <p>
        <span className="font-medium text-ink">شماره تماس:</span>{" "}
        <span className="text-charcoal-muted" dir="ltr">
          {phone?.trim() || "ثبت نشده"}
        </span>
      </p>
    </div>
  );
}
