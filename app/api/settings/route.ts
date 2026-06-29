import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return NextResponse.json(setting);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const cardNumber = String(body.cardNumber || "").trim();
  const instructions = String(body.instructions || "").trim();

  if (!cardNumber || !instructions) {
    return NextResponse.json({ error: "اطلاعات تنظیمات ناقص است" }, { status: 400 });
  }

  const setting = await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: { cardNumber, instructions },
    create: { id: 1, cardNumber, instructions },
  });

  return NextResponse.json(setting);
}
