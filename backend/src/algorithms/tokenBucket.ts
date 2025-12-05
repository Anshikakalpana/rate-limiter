import type { Result } from "../types/index.js";
import { redis } from "../utils/redis.js";

export async function tokenBucketAlgorithm(
  key: string,
  limit: number,
  refillRatePerSecond: number,   
  tokensRequested:number,   
): Promise<Result> {
  try {
    const redisKey = `token_bucket:{${key}}`;
    const lastRefillKey = `${redisKey}:last_refill`;
    const currentTime = Math.floor(Date.now() / 1000);
    const statsKey= `stats:${key}`;
     const globalStatsKey = `stats:global`;

  
    const lastRefill = await redis.get(lastRefillKey);
    const lastRefillTime: number = lastRefill ? parseInt(lastRefill) : currentTime;

  
    let currentCountStr = await redis.get(redisKey);
    let currentCount: number = currentCountStr ? parseInt(currentCountStr) : limit;

    const elapsed = currentTime - lastRefillTime;
    const tokensToAdd = Math.floor(elapsed * refillRatePerSecond);
    currentCount = Math.min(limit, currentCount + tokensToAdd);

  
    if (currentCount < tokensRequested) {
      await redis.hincrby(statsKey, 'blocked', 1);
      await redis.hincrby(statsKey, 'total', 1);
      await redis.hincrby(globalStatsKey, 'blocked', 1);
      await redis.hincrby(globalStatsKey, 'total', 1);
     await redis.hincrby(globalStatsKey, 'total', 1);
      return {
        allowed: false,
      
        tokensRemaining: currentCount,
        retryAfterTime: Math.ceil((tokensRequested - currentCount) / refillRatePerSecond),
      };
    }

  
    currentCount -= tokensRequested;
    await redis.hincrby(statsKey, 'allowed', 1);
    await redis.hincrby(statsKey, 'total', 1);
    await redis.hincrby(globalStatsKey, 'allowed', 1);
    await redis.hincrby(globalStatsKey, 'total', 1);
 
    await redis.set(redisKey, currentCount);
    await redis.set(lastRefillKey, currentTime.toString());

    return {
      allowed: true,
      tokensRemaining: currentCount,
    };
  } catch (err) {
    console.error("Token Bucket Error:", err);
    return {
      allowed: true,
      tokensRemaining: limit,
    };
  }
}


