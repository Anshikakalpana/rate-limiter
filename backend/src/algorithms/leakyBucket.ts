import type { Result } from "../types/index.js";
import { redis } from "../utils/redis.js";

export async function leakyBucketAlgorithm(
  key: string,
  capacity: number,       
  leakRatePerSecond: number, 
  tokensRequested: number = 1
): Promise<Result> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const redisKey = `leaky_bucket:{${key}}`;
    const statsKey = `stats:{${key}}`;
    const globalStatsKey = `stats:global`;

   
    const bucket = await redis.hgetall(redisKey);
    
    let queueSize = bucket.queueSize ? parseFloat(bucket.queueSize) : 0;
    let lastLeakTime = bucket.lastLeakTime ? parseInt(bucket.lastLeakTime) : currentTime;

    
    const timeElapsed = currentTime - lastLeakTime;
    const requestsLeaked = timeElapsed * leakRatePerSecond;
    
  
    queueSize = Math.max(0, queueSize - requestsLeaked);

   
    if (queueSize + tokensRequested > capacity) {
   
      await redis.hincrby(statsKey, 'blocked', 1);
      await redis.hincrby(statsKey, 'total', 1);
      await redis.hincrby(globalStatsKey, 'blocked', 1);
      await redis.hincrby(globalStatsKey, 'total', 1);

    
      await redis.hset(redisKey, {
        queueSize: Math.floor(queueSize).toString(),
        lastLeakTime: currentTime.toString(),
      });
      await redis.expire(redisKey, Math.ceil(capacity / leakRatePerSecond) + 10);

      return {
        allowed: false,
        tokensRemaining: Math.floor(capacity - queueSize),
        retryAfterTime: Math.ceil((queueSize + tokensRequested - capacity) / leakRatePerSecond),
      };
    }

   
    queueSize += tokensRequested;

    await redis.hincrby(statsKey, 'allowed', 1);
    await redis.hincrby(statsKey, 'total', 1);
    await redis.hincrby(globalStatsKey, 'allowed', 1);
    await redis.hincrby(globalStatsKey, 'total', 1);


    await redis.hset(redisKey, {
      queueSize: queueSize.toString(),
      lastLeakTime: currentTime.toString(),
    });
    await redis.expire(redisKey, Math.ceil(capacity / leakRatePerSecond) + 10);

    return {
      allowed: true,
      tokensRemaining: Math.floor(capacity - queueSize),
    };

  } catch (err) {
    console.error('Leaky Bucket Error:', err);
    return {
      allowed: true,
      tokensRemaining: capacity,
    };
  }
}