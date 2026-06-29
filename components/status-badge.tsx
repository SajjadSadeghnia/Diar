import clsx from "clsx";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const statusMap: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }>; color: string }> = {
  pending_payment: { label: "در انتظار پرداخت", icon: Clock, color: "amber" },
  awaiting_admin_review: { label: "در انتظار بررسی", icon: Clock, color: "blue" },
  pending: { label: "در انتظار پرداخت", icon: Clock, color: "amber" },
  approved: { label: "تایید شده", icon: CheckCircle, color: "emerald" },
  rejected: { label: "رد شده", icon: XCircle, color: "rose" },
  expired: { label: "منقضی شده", icon: AlertCircle, color: "slate" },
  available: { label: "موجود", color: "emerald" },
  temporarily_reserved: { label: "رزرو موقت", icon: Clock, color: "amber" },
  reserved: { label: "رزرو شده", icon: CheckCircle, color: "rose" },
  unavailable: { label: "ناموجود", color: "rose" },
};

const colorClasses = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const statusInfo = statusMap[status] || { label: status, color: "slate" };
  const Icon = statusInfo.icon;
  const sizeClasses = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200",
        colorClasses[statusInfo.color as keyof typeof colorClasses],
        sizeClasses
      )}
      role="status"
      aria-label={`وضعیت: ${statusInfo.label}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {statusInfo.label}
    </span>
  );
}
