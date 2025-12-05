import type { Result } from "../types/index.js";
import { redis } from "../utils/redis.js";

export async function slidingWindowAlgorithm(
  key: string,
  limit: number,
  windowSize: number
): Promise<Result> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSize;
    const redisKey = `sliding_log:{${key}}`;
 const statsKey= `stats:{${key}}`;
     const globalStatsKey = `stats:global`;

    await redis.zremrangebyscore(redisKey, 0, windowStart);

 
    const count = await redis.zcard(redisKey);

 
    if (count >= limit) {

          await redis.hincrby(statsKey, 'blocked', 1);
    await redis.hincrby(statsKey, 'total', 1);
    await redis.hincrby(globalStatsKey, 'blocked', 1);
    await redis.hincrby(globalStatsKey, 'total', 1);
 
      const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");

      const oldestTimestamp =
        oldest.length > 1 ? parseInt(oldest[1]) : now;

      const resetTime = oldestTimestamp + windowSize;
      const retryAfter = resetTime - now;

      return {
        allowed: false,
        tokensRemaining: 0,
        resetTime,
        retryAfterTime: retryAfter,
      };
    }

          await redis.hincrby(statsKey, 'allowed', 1);
    await redis.hincrby(statsKey, 'total', 1);
    await redis.hincrby(globalStatsKey, 'allowed', 1);
    await redis.hincrby(globalStatsKey, 'total', 1);
    await redis.zadd(redisKey, now, `${now}`);

  
    await redis.expire(redisKey, windowSize);

    return {
      allowed: true,
      tokensRemaining: limit - count - 1,
      resetTime: now + windowSize,
    };
  } catch (err) {
    console.error("Sliding Window Error:", err);
    return {
      allowed: true,
      tokensRemaining: limit,
    };
  }
}
