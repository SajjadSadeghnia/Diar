import { requireAdminUser } from "@/lib/auth-session";
import { getNightKey } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const overrides = await prisma.dateOverride.findMany({
    where: { propertyId: id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(
    overrides.map((o) => ({
      id: o.id,
      date: o.date.toISOString(),
      price: o.price,
      closed: o.closed,
    }))
  );
}

export async function POST(req: Request, { params }: RouteParams) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const parsed = new Date(String(body.date || ""));
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "تاریخ نامعتبر است" }, { status: 400 });
  }
  const date = getNightKey(parsed);

  const closed = body.closed === true;
  let price: number | null = null;
  if (body.price !== undefined && body.price !== null && body.price !== "") {
    price = Number(body.price);
    if (!Number.isInteger(price) || price <= 0) {
      return NextResponse.json({ error: "قیمت باید عدد صحیح مثبت باشد" }, { status: 400 });
    }
  }

  const property = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!property) {
    return NextResponse.json({ error: "ملک یافت نشد" }, { status: 404 });
  }

  if (price === null && !closed) {
    await prisma.dateOverride.deleteMany({ where: { propertyId: id, date } });
    return NextResponse.json({ removed: true });
  }

  const override = await prisma.dateOverride.upsert({
    where: { propertyId_date: { propertyId: id, date } },
    update: { price, closed },
    create: { propertyId: id, date, price, closed },
  });

  return NextResponse.json({
    id: override.id,
    date: override.date.toISOString(),
    price: override.price,
    closed: override.closed,
  });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const parsed = new Date(String(body.date || ""));
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "تاریخ نامعتبر است" }, { status: 400 });
  }

  await prisma.dateOverride.deleteMany({
    where: { propertyId: id, date: getNightKey(parsed) },
  });

  return NextResponse.json({ removed: true });
}
