/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Serverless instances are ephemeral and per-instance, so this is a best-effort
 * abuse brake for unauthenticated endpoints (for example the public
 * `request-changes` webhook), not a hard guarantee. A hard limit would require a
 * shared store such as Postgres or Upstash.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Hard cap on tracked keys so a long-lived process cannot leak memory. */
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

/**
 * Records a hit for `key` and reports whether the caller exceeded `max` hits
 * within the trailing `windowMs`.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [existingKey, existingBucket] of Array.from(buckets.entries())) {
      if (existingBucket.timestamps.every((timestamp) => now - timestamp >= windowMs)) {
        buckets.delete(existingKey);
      }
    }
  }

  return { limited: false, retryAfterSeconds: 0 };
}

/** Best-effort client identifier for rate limiting. */
export function getClientIp(request: {
  headers: { get(name: string): string | null };
}): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0];
    if (first && first.trim()) return first.trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Test/maintenance helper: clears all tracked windows. */
export function resetRateLimits(): void {
  buckets.clear();
}
