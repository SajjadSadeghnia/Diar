const RECEIPT_PREFIX = "/uploads/receipts/";

/** Map stored receipt path to authenticated API URL (blocks public /uploads/receipts access). */
export function toSecureReceiptUrl(receiptPath: string | null | undefined): string {
  if (!receiptPath) return "";
  if (receiptPath.startsWith("/api/files/receipts/")) return receiptPath;

  const filename = receiptPath.startsWith(RECEIPT_PREFIX)
    ? receiptPath.slice(RECEIPT_PREFIX.length)
    : receiptPath.replace(/^\/+/, "");

  return `/api/files/receipts/${encodeURIComponent(filename)}`;
}

export function receiptFilenameFromPath(receiptPath: string): string | null {
  const normalized = receiptPath.startsWith(RECEIPT_PREFIX)
    ? receiptPath.slice(RECEIPT_PREFIX.length)
    : receiptPath.replace(/^\/api\/files\/receipts\//, "");

  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(normalized)) {
    return null;
  }

  return normalized;
}
