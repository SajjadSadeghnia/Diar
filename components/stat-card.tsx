import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENTS = {
  ink: { border: "border-ink/10", badge: "bg-ink-soft text-ink", value: "text-ink" },
  sea: { border: "border-sea/15", badge: "bg-sea-soft text-sea", value: "text-ink" },
  clay: { border: "border-clay/20", badge: "bg-clay/10 text-clay", value: "text-clay" },
  amber: { border: "border-amber-200", badge: "bg-amber-50 text-amber-700", value: "text-amber-700" },
} as const;

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: keyof typeof ACCENTS;
  caption?: ReactNode;
  valueClassName?: string;
}

export function StatCard({ label, value, icon, accent = "ink", caption, valueClassName }: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className={cn("card", a.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-charcoal-muted">{label}</p>
          <p className={cn("mt-2 font-bold", valueClassName ?? "text-2xl", a.value)}>{value}</p>
          {caption && <p className="mt-1 text-xs text-charcoal-muted/70">{caption}</p>}
        </div>
        {icon && <span className={cn("shrink-0 rounded-xl p-2.5", a.badge)}>{icon}</span>}
      </div>
    </div>
  );
}
