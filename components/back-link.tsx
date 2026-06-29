import Link from "next/link";

export function BackLink({ href = "/", label = "بازگشت به خانه" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
      <span>←</span>
      <span>{label}</span>
    </Link>
  );
}
