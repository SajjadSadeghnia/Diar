import { prisma } from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signToken } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(1, "شماره تماس الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

const WRONG_CREDENTIALS = "شماره تماس یا رمز عبور اشتباه است";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: WRONG_CREDENTIALS }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: WRONG_CREDENTIALS }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: WRONG_CREDENTIALS }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: "حساب کاربری شما غیرفعال شده است" }, { status: 403 });
    }

    const token = signToken({ userId: user.id, role: user.role, name: user.name });
    const response = NextResponse.json({ role: user.role });

    const protocol = req.url.startsWith("https:") ? "https" : "http";
    const isSecure = protocol === "https";
    const sameSite = isSecure ? "none" : "lax";

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSite,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
