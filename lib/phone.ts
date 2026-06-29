/** Normalize Iranian mobile numbers for lookup (09xxxxxxxxx). */
export function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
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
