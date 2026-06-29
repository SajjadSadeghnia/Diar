import { getCurrentUser } from "@/lib/auth";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import { getPropertyAvailabilityState, toBookingRange } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const bookings = await fetchBlockingBookings(id);
  const ranges = bookings.map(toBookingRange);

  const availability = getPropertyAvailabilityState(ranges);

  return NextResponse.json({
    ...property,
    availability,
    dbStatus: property.status,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  const address = String(formData.get("address") || "");
  const contactPhone = String(formData.get("contactPhone") || "");
  const dailyPrice = Number(formData.get("dailyPrice") || 0);
  const status = String(formData.get("status") || "available") as "available" | "unavailable";
  const files = formData.getAll("images") as File[];

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  const imagePaths = [...existing.images];
  for (const file of files) {
    if (file.size > 0) imagePaths.push(await saveFile(file, "properties"));
  }

  const updated = await prisma.property.update({
    where: { id },
    data: { title, description, address, contactPhone, dailyPrice, status, images: imagePaths },
  });

  return NextResponse.json(updated);
}

export async function DELETE() {
  return NextResponse.json(
    { error: "حذف ملک در سامانه تک‌ملکی دیار مجاز نیست." },
    { status: 403 }
  );
}
