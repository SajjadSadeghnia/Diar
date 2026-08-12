import fs from "fs/promises";
import path from "path";
import { requireActiveUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { receiptFilenameFromPath } from "@/lib/receipt-url";
import { NextResponse } from "next/server";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { filename: rawFilename } = await params;
  const filename = receiptFilenameFromPath(`/uploads/receipts/${decodeURIComponent(rawFilename)}`);
  if (!filename) {
    return NextResponse.json({ error: "فایل نامعتبر است" }, { status: 400 });
  }

  const receiptPath = `/uploads/receipts/${filename}`;
  const payment = await prisma.payment.findFirst({
    where: { receiptPath },
    include: { booking: { select: { userId: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "فیش یافت نشد" }, { status: 404 });
  }

  if (auth.user.role === "employee" && payment.booking.userId !== auth.user.userId) {
    return NextResponse.json({ error: "دسترسی به این فیش مجاز نیست" }, { status: 403 });
  }

  const fullPath = path.join(process.cwd(), "public", "uploads", "receipts", filename);

  try {
    const buffer = await fs.readFile(fullPath);
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }
}
