export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  async acquire(providerId: string, requestsPerMinute: number): Promise<boolean> {
    if (requestsPerMinute <= 0) return true;

    const now = Date.now();
    const windowMs = 60 * 1000;
    const history = this.timestamps.get(providerId) || [];

    // Filter out timestamps older than 1 minute
    const recent = history.filter((t) => now - t < windowMs);

    if (recent.length >= requestsPerMinute) {
      // Rate limit exceeded
      return false;
    }

    recent.push(now);
    this.timestamps.set(providerId, recent);
    return true;
  }

  getRemainingLimit(providerId: string, requestsPerMinute: number): number {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const history = (this.timestamps.get(providerId) || []).filter((t) => now - t < windowMs);
    return Math.max(0, requestsPerMinute - history.length);
  }

  reset(providerId?: string) {
    if (providerId) {
      this.timestamps.delete(providerId);
    } else {
      this.timestamps.clear();
    }
  }
}

export const globalRateLimiter = new RateLimiter();
