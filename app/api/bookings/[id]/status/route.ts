import { NextResponse } from "next/server";

/** Deprecated — use payment review or reject booking flows instead of arbitrary status changes. */
export async function PATCH() {
  return NextResponse.json(
    { error: "تغییر مستقیم وضعیت غیرفعال است. از تایید/رد پرداخت یا رد رزرو استفاده کنید." },
    { status: 403 }
  );
}
