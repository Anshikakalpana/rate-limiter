import type { Result } from "../types/index.js";
import { redis } from "../utils/redis.js";

export async function fixedWindowAlgorithm(
  key: string,
  limit: number,
  windowSize: number
): Promise<Result> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const windowStartTime = Math.floor(currentTime / windowSize) * windowSize;

    const redisKey = `fixed_window:{${key}}:${windowStartTime}`;
   const statsKey = `stats:{${key}}`;          // per-user stats
const globalStatsKey = `stats:{global}`;   // global stats


    const currentCount = await redis.get(redisKey);
    const count = currentCount ? parseInt(currentCount) : 0;

    // BLOCKED CASE
    if (count >= limit) {
      let blocked = await redis.hincrby(statsKey, "blocked", 1);
      let total = await redis.hincrby(statsKey, "total", 1);

      await redis.hincrby(globalStatsKey, "blocked", 1);
      await redis.hincrby(globalStatsKey, "total", 1);

      return {
        allowed: false,
        algorithmName: "fixed_window",

        tokensRemaining: 0,
        retryAfterTime: windowStartTime + windowSize - currentTime,
        resetTime: windowStartTime + windowSize,

        blockedRequests: blocked,
        totalRequests: total,
        allowedRequests: total - blocked,
      };
    }

    // ALLOWED CASE
    await redis.incr(redisKey);
    await redis.expire(redisKey, windowSize);

    let allowed = await redis.hincrby(statsKey, "allowed", 1);
    let total = await redis.hincrby(statsKey, "total", 1);

    await redis.hincrby(globalStatsKey, "allowed", 1);
    await redis.hincrby(globalStatsKey, "total", 1);

    return {
      allowed: true,
      algorithmName: "fixed_window",

      tokensRemaining: limit - (count + 1),
      resetTime: windowStartTime + windowSize,

      blockedRequests: total - allowed,
      totalRequests: total,
      allowedRequests: allowed,
    };
  } catch (err) {
    console.error("Fixed Window Error:", err);

    return {
      allowed: true,
      algorithmName: "fixed_window",
      tokensRemaining: limit,

      blockedRequests: 0,
      totalRequests: 0,
      allowedRequests: 0,
    };
  }
}
