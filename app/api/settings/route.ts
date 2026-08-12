import { requireActiveUser, requireAdminUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const setting = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return NextResponse.json(setting);
}

export async function PUT(req: Request) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const current = await prisma.systemSetting.findUnique({ where: { id: 1 } });

  const cardNumber = body.cardNumber !== undefined ? String(body.cardNumber).trim() : (current?.cardNumber ?? "");
  const instructions = body.instructions !== undefined ? String(body.instructions).trim() : (current?.instructions ?? "");
  const contactPhone = body.contactPhone !== undefined ? String(body.contactPhone).trim() : (current?.contactPhone ?? "");
  const contactInfo = body.contactInfo !== undefined ? String(body.contactInfo).trim() : (current?.contactInfo ?? "");

  if (!cardNumber || !instructions) {
    return NextResponse.json({ error: "اطلاعات تنظیمات ناقص است" }, { status: 400 });
  }

  if (!contactPhone || !contactInfo) {
    return NextResponse.json({ error: "اطلاعات تماس ناقص است" }, { status: 400 });
  }

  const setting = await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: { cardNumber, instructions, contactPhone, contactInfo },
    create: { id: 1, cardNumber, instructions, contactPhone, contactInfo },
  });

  return NextResponse.json(setting);
}
