import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Allowed MIME types for security
const ALLOWED_MIME_TYPES = {
  properties: ["image/jpeg", "image/png", "image/webp"],
  receipts: ["image/jpeg", "image/png", "image/webp"],
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function saveFile(file: File, type: "properties" | "receipts") {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("حجم فایل بیش از حد مجاز است (حداکثر 2 مگابایت)");
  }

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[type];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("نوع فایل غیرمجاز است. فقط تصاویر JPEG، PNG و WEBP مجاز هستند");
  }

  // Additional validation: check file extension matches MIME type
  const ext = file.name.split(".").pop()?.toLowerCase();
  const validExtensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  if (!ext || !validExtensions[file.type]?.includes(ext)) {
    throw new Error("پسوند فایل با نوع فایل مطابقت ندارد");
  }

  // Generate safe filename
  const safeExt = ext === "jpg" && file.type === "image/jpeg" ? "jpg" : ext;
  const fileName = `${randomUUID()}.${safeExt}`;
  const relativePath = `/uploads/${type}/${fileName}`;
  const fullPath = path.join(process.cwd(), "public", relativePath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  // Write file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.writeFile(fullPath, buffer);

  return relativePath;
}
