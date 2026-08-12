import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-ink/20">۴۰۴</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">صفحه پیدا نشد</h1>
      <p className="mt-2 text-sm text-charcoal-muted">آدرس وارد شده در سامانه دیار وجود ندارد.</p>
      <Link href="/" className="btn-primary mt-6">
        بازگشت به خانه
      </Link>
    </div>
  );
}
