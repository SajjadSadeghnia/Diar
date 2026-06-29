import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_PROPERTY_DETAILS,
  GANJE_FULL_ADDRESS,
  GANJE_MAP_URL,
  GANJE_PROPERTY_IMAGES,
  GANJE_PROPERTY_TITLE,
} from "../lib/property-details";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  const password = await bcrypt.hash("12345678", 10);

  await prisma.user.createMany({
    data: [
      { name: "ادمین سیستم", phone: "09120000000", password, role: Role.admin },
      { name: "کارمند یک", phone: "09121111111", password, role: Role.employee },
      { name: "کارمند دو", phone: "09122222222", password, role: Role.employee },
      { name: "کارمند سه", phone: "09123333333", password, role: Role.employee },
    ],
  });

  await prisma.property.create({
    data: {
      title: GANJE_PROPERTY_TITLE,
      description:
        "واحد سازمانی در شهر نور، مجتمع نگین نور — دسترسی به دریا از درب شهرک، نزدیک سوپرمارکت و رستوران، مناسب اقامت خانواده کارمندان.",
      address: GANJE_FULL_ADDRESS,
      contactPhone: "021-88776655",
      dailyPrice: 3500000,
      images: [...GANJE_PROPERTY_IMAGES],
      capacity: 5,
      bedrooms: 2,
      bathroomInfo: "یک سرویس ایرانی",
      seaDistance: "ورودی دریا از درب داخل شهرک",
      mapUrl: GANJE_MAP_URL,
      mobileSignal: "مناسب",
      detailsJson: DEFAULT_PROPERTY_DETAILS,
      status: "available",
    },
  });

  await prisma.systemSetting.create({
    data: {
      id: 1,
      cardNumber: "6037-9975-0000-0000",
      instructions: "پس از واریز، تصویر رسید را بارگذاری کنید تا توسط ادمین بررسی شود.",
    },
  });

  console.log("Seed done (single property + dev users — login with phone + password 12345678)");
  console.log("  Admin: 09120000000");
  console.log("  Employee: 09121111111 / 09122222222 / 09123333333");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
