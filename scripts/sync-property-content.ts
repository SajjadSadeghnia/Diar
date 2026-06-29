/**
 * Updates the single property with villa content + images without wiping bookings.
 * Run: npx tsx scripts/sync-property-content.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_PROPERTY_DETAILS,
  GANJE_FULL_ADDRESS,
  GANJE_MAP_URL,
  GANJE_PROPERTY_IMAGES,
  GANJE_PROPERTY_TITLE,
} from "../lib/property-details";

const prisma = new PrismaClient();

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

  const any = await prisma.property.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return any?.id ?? null;
}

async function main() {
  const propertyId = await resolveCanonicalPropertyId();
  if (!propertyId) {
    console.log("No property found — run prisma db seed first.");
    return;
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      title: GANJE_PROPERTY_TITLE,
      description:
        "واحد سازمانی در شهر نور، مجتمع نگین نور — دسترسی به دریا از درب شهرک، نزدیک سوپرمارکت و رستوران، مناسب اقامت خانواده کارمندان.",
      address: GANJE_FULL_ADDRESS,
      images: [...GANJE_PROPERTY_IMAGES],
      capacity: 5,
      bedrooms: 2,
      bathroomInfo: "یک سرویس ایرانی",
      seaDistance: "ورودی دریا از درب داخل شهرک",
      mapUrl: GANJE_MAP_URL,
      mobileSignal: "مناسب",
      detailsJson: DEFAULT_PROPERTY_DETAILS,
    },
  });

  console.log("Property content synced:", propertyId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
