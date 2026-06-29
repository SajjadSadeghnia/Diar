import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Signup is disabled in the private "دیار" system
  return NextResponse.json(
    { error: "ثبت نام غیرفعال است" },
    { status: 403 }
  );
}
