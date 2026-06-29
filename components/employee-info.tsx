type EmployeeInfoProps = {
  name: string;
  phone?: string | null;
  className?: string;
};

export function EmployeeInfo({ name, phone, className = "" }: EmployeeInfoProps) {
  return (
    <div className={`space-y-1 text-sm ${className}`}>
      <p>
        <span className="font-medium text-slate-700">نام کارمند:</span>{" "}
        <span className="text-slate-600">{name}</span>
      </p>
      <p>
        <span className="font-medium text-slate-700">شماره تماس:</span>{" "}
        <span className="text-slate-600" dir="ltr">
          {phone?.trim() || "ثبت نشده"}
        </span>
      </p>
    </div>
  );
}
