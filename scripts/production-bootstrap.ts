/**
 * One-time production database bootstrap.
 *
 * Creates: admin user (from env), SystemSetting, single property.
 * Does NOT: create test employees, bookings, or wipe existing data.
 *
 * Usage:
 *   ADMIN_PHONE=... ADMIN_PASSWORD=... ADMIN_NAME=... npx tsx scripts/production-bootstrap.ts
 *
 * Safe to re-run: skips existing admin by phone; upserts settings & canonical property.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_PROPERTY_DETAILS,
  GANJE_FULL_ADDRESS,
  GANJE_MAP_URL,
  GANJE_PROPERTY_IMAGES,
  GANJE_PROPERTY_TITLE,
} from "../lib/property-details";
import { isValidPhone, normalizePhone } from "../lib/phone";

const prisma = new PrismaClient();

const PROPERTY_DESCRIPTION =
  "واحد سازمانی در شهر نور، مجتمع نگین نور — دسترسی به دریا از درب شهرک، نزدیک سوپرمارکت و رستوران، مناسب اقامت خانواده کارمندان.";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function ensureAdmin() {
  const phone = normalizePhone(requireEnv("ADMIN_PHONE"));
  const password = requireEnv("ADMIN_PASSWORD");
  const name = requireEnv("ADMIN_NAME");

  if (!isValidPhone(phone)) {
    throw new Error(`ADMIN_PHONE must be a valid Iranian mobile (09xxxxxxxxx), got: ${phone}`);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.role !== Role.admin) {
      console.log(`SKIP admin: ${phone} exists but role is ${existing.role} (not admin). Fix manually.`);
      return existing;
    }
    console.log(`SKIP admin: ${phone} already exists (id=${existing.id}).`);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { name, phone, password: hashed, role: Role.admin },
  });
  console.log(`CREATED admin: ${phone} (id=${admin.id})`);
  return admin;
}

async function ensureSystemSetting() {
  const cardNumber = process.env.PAYMENT_CARD_NUMBER?.trim() || "6037-9975-0000-0000";
  const instructions =
    process.env.PAYMENT_INSTRUCTIONS?.trim() ||
    "پس از واریز، تصویر رسید را بارگذاری کنید تا توسط ادمین بررسی شود.";

  const setting = await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: { cardNumber, instructions },
    create: { id: 1, cardNumber, instructions },
  });
  console.log(`UPSERT SystemSetting id=1 (card …${setting.cardNumber.slice(-4)})`);
}

async function resolveCanonicalPropertyId() {
  const organizational = await prisma.property.findFirst({
    where: {
      OR: [
        { title: { contains: "مازندران" } },
        { title: { contains: "نگین" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (organizational) return organizational.id;

  const withImages = await prisma.property.findFirst({
    where: { images: { isEmpty: false } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (withImages) return withImages.id;

  return (
    await prisma.property.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
  )?.id;
}

async function ensureProperty() {
  const contactPhone = process.env.PROPERTY_CONTACT_PHONE?.trim() || "021-88776655";
  const dailyPrice = Number(process.env.PROPERTY_DAILY_PRICE || "3500000");

  const propertyData = {
    title: GANJE_PROPERTY_TITLE,
    description: PROPERTY_DESCRIPTION,
    address: GANJE_FULL_ADDRESS,
    contactPhone,
    dailyPrice,
    images: [...GANJE_PROPERTY_IMAGES],
    capacity: 5,
    bedrooms: 2,
    bathroomInfo: "یک سرویس ایرانی",
    seaDistance: "ورودی دریا از درب داخل شهرک",
    mapUrl: GANJE_MAP_URL,
    mobileSignal: "مناسب",
    detailsJson: DEFAULT_PROPERTY_DETAILS,
    status: "available" as const,
  };

  const existingId = await resolveCanonicalPropertyId();

  if (existingId) {
    const updated = await prisma.property.update({
      where: { id: existingId },
      data: propertyData,
    });
    console.log(`UPDATED property: ${updated.title} (id=${updated.id})`);
    return;
  }

  const created = await prisma.property.create({ data: propertyData });
  console.log(`CREATED property: ${created.title} (id=${created.id})`);
}

async function main() {
  const propertyCount = await prisma.property.count();
  if (propertyCount > 1) {
    console.warn(
      `WARNING: ${propertyCount} properties in DB. Bootstrap updates one canonical property only. Remove extras manually if needed.`
    );
  }

  await ensureAdmin();
  await ensureSystemSetting();
  await ensureProperty();

  console.log("\nBootstrap complete.");
  console.log("Next: copy images to uploads/properties/ , verify gallery, change admin password if needed.");
}

main()
  .catch((e) => {
    console.error("Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
