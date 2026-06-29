import { getCurrentUser } from "@/lib/auth";
import { getSingleProperty } from "@/lib/property";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import { getPropertyAvailabilityState, toBookingRange } from "@/lib/booking-utils";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await getSingleProperty();

  if (!property) {
    return NextResponse.json([]);
  }

  const bookings = await fetchBlockingBookings(property.id);
  const ranges = bookings.map(toBookingRange);

  const availability = getPropertyAvailabilityState(ranges);

  return NextResponse.json([
    {
      ...property,
      availability,
    },
  ]);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const existingCount = await prisma.property.count();
  if (existingCount >= 1) {
    return NextResponse.json(
      { error: "در سامانه دیار فقط یک ملک مجاز است. ملک موجود را ویرایش کنید." },
      { status: 409 }
    );
  }

  const formData = await req.formData();
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  const address = String(formData.get("address") || "");
  const contactPhone = String(formData.get("contactPhone") || "");
  const dailyPrice = Number(formData.get("dailyPrice") || 0);
  const status = String(formData.get("status") || "available") as "available" | "unavailable";
  const files = formData.getAll("images") as File[];

  if (!title || !description || !address || !contactPhone || !dailyPrice) {
    return NextResponse.json({ error: "اطلاعات کامل نیست" }, { status: 400 });
  }

  const imagePaths: string[] = [];
  for (const file of files) {
    if (file.size > 0) imagePaths.push(await saveFile(file, "properties"));
  }

  const created = await prisma.property.create({
    data: { title, description, address, contactPhone, dailyPrice, status, images: imagePaths },
  });

  return NextResponse.json(created);
}
