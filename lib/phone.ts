const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Persian/Arabic-Indic digits to ASCII so phone numbers typed on
 * non-English keyboards (common on Iranian phones) still validate. */
function toAsciiDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(ch);
    if (persianIndex !== -1) return String(persianIndex);
    return String(ARABIC_INDIC_DIGITS.indexOf(ch));
  });
}

/** Normalize Iranian mobile numbers for lookup (09xxxxxxxxx). */
export function normalizePhone(input: string): string {
  const trimmed = toAsciiDigits(input.trim().replace(/\s+/g, ""));
  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits;
  }

  return trimmed;
}

export function isValidPhone(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}
