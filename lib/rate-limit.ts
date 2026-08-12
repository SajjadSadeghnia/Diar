type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function getClientKey(req: Request, phone: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${ip}:${phone}`;
}

export function isLoginRateLimited(req: Request, phone: string): boolean {
  const key = getClientKey(req, phone);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > LOGIN_MAX_ATTEMPTS;
}

export function resetLoginRateLimit(req: Request, phone: string): void {
  buckets.delete(getClientKey(req, phone));
}
