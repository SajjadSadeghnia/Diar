/** Structured villa details for دیار single-property presentation */

export type PropertyDetailsJson = {
  accessNearby: string[];
  parking: string[];
  diningItems: string[];
  amenities: Array<{ key: string; label: string; value: string }>;
};

export const DEFAULT_PROPERTY_DETAILS: PropertyDetailsJson = {
  accessNearby: ["پمپ بنزین", "رستوران", "سوپرمارکت"],
  parking: [
    "یک پارکینگ اختصاصی",
    "برخورداری از پارکینگ میهمان در صورت خلوت بودن شهرک",
  ],
  diningItems: ["بشقاب", "قاشق", "چنگال", "یک قابلمه", "یک ماهیتابه"],
  amenities: [
    { key: "terrace", label: "تراس", value: "دارد" },
    { key: "cooking", label: "وسایل پخت و پز", value: "محدود" },
    { key: "bbq", label: "باربیکیو", value: "دارد" },
    { key: "green", label: "فضای سبز", value: "دارد" },
    { key: "guard", label: "نگهبان", value: "دارد" },
    { key: "pets", label: "امکان نگهداری سگ", value: "ندارد" },
  ],
};

export const GANJE_MAP_URL = "https://nshn.ir/QbfZVc0FYupS";

export const GANJE_PROPERTY_TITLE = "دیار ۱";

export const GANJE_PROPERTY_DESCRIPTION =
  "اقامات در فضایی آرام با دسترسی مستقيم به ساحل از درب شهرک، در مجاورت سوپرمارکت و رستوران های محلی ";

export const GANJE_FULL_ADDRESS =
  "أدرس : مازندران، شهر نور، خیابان امام رضا، مجتمع نگین نور، بلوک ۱، طبقه چهار، واحد ۱۴";

export const GANJE_PROPERTY_IMAGES = [
  "/uploads/properties/ganje-10-bedroom.png",
  "/uploads/properties/ganje-01-entrance.png",
  "/uploads/properties/ganje-02-complex.png",
  "/uploads/properties/ganje-03-sea-view.png",
  "/uploads/properties/ganje-04-living.png",
  "/uploads/properties/ganje-05-sea-window.png",
  "/uploads/properties/ganje-06-living-kitchen.png",
  "/uploads/properties/ganje-07-kitchen.png",
  "/uploads/properties/ganje-08-fireplace.png",
  "/uploads/properties/ganje-09-bedroom.png",
  "/uploads/properties/ganje-11-bedroom.png",
  "/uploads/properties/ganje-12-bathroom.png",
] as const;

export function parsePropertyDetails(raw: unknown): PropertyDetailsJson {
  if (!raw || typeof raw !== "object") return DEFAULT_PROPERTY_DETAILS;
  const d = raw as Partial<PropertyDetailsJson>;
  return {
    accessNearby: Array.isArray(d.accessNearby) ? d.accessNearby : DEFAULT_PROPERTY_DETAILS.accessNearby,
    parking: Array.isArray(d.parking) ? d.parking : DEFAULT_PROPERTY_DETAILS.parking,
    diningItems: Array.isArray(d.diningItems) ? d.diningItems : DEFAULT_PROPERTY_DETAILS.diningItems,
    amenities: Array.isArray(d.amenities) ? d.amenities : DEFAULT_PROPERTY_DETAILS.amenities,
  };
}

export type PropertyPresentation = {
  id: string;
  title: string;
  description: string;
  address: string;
  contactPhone: string;
  dailyPrice: number;
  images: string[];
  dbStatus: string;
  capacity: number;
  bedrooms: number;
  bathroomInfo: string;
  seaDistance: string;
  mapUrl: string | null;
  mobileSignal: string;
  details: PropertyDetailsJson;
};

export function toPropertyPresentation(property: {
  id: string;
  title: string;
  description: string;
  address: string;
  contactPhone: string;
  dailyPrice: number;
  images: string[];
  status: string;
  capacity?: number | null;
  bedrooms?: number | null;
  bathroomInfo?: string | null;
  seaDistance?: string | null;
  mapUrl?: string | null;
  mobileSignal?: string | null;
  detailsJson?: unknown;
}): PropertyPresentation {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    address: property.address,
    contactPhone: property.contactPhone,
    dailyPrice: property.dailyPrice,
    images: property.images,
    dbStatus: property.status,
    capacity: property.capacity ?? 5,
    bedrooms: property.bedrooms ?? 2,
    bathroomInfo: property.bathroomInfo ?? "یک سرویس ایرانی",
    seaDistance: property.seaDistance ?? "ورودی دریا از درب داخل شهرک",
    mapUrl: property.mapUrl ?? GANJE_MAP_URL,
    mobileSignal: property.mobileSignal ?? "مناسب",
    details: parsePropertyDetails(property.detailsJson),
  };
}

/** Short amenity labels for homepage preview */
export function getHomepageAmenityPreview(details: PropertyDetailsJson): string[] {
  return details.amenities
    .filter((a) => a.value === "دارد")
    .slice(0, 6)
    .map((a) => a.label);
}
