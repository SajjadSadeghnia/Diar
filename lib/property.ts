import { prisma } from "@/lib/prisma";

/** Returns the canonical single property for the دیار system. */
export async function getSingleProperty() {
  const organizational = await prisma.property.findFirst({
    where: {
      OR: [
        { title: { contains: "مازندران" } },
        { title: { contains: "نگین" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  if (organizational) return organizational;

  const withImages = await prisma.property.findFirst({
    where: { images: { isEmpty: false } },
    orderBy: { createdAt: "desc" },
  });
  if (withImages) return withImages;

  return prisma.property.findFirst({ orderBy: { createdAt: "desc" } });
}
