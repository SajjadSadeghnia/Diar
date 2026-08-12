import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "diar" });
  } catch {
    return NextResponse.json({ ok: false, service: "diar" }, { status: 503 });
  }
}
