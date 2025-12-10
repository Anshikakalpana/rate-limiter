//data is not lost

import type { Result } from "../types/index.js";


// export async function tokenBucketAlgorithm(
//   key: string,
//   limit: number, //max tokens  a bucket can hold
//   refillRatePerSecond: number,   
//   tokensRequested:number,   
// ): Promise<Result> {
//   try {
//     const redisKey = `token_bucket:{${key}}`;
//     const lastRefillKey = `${redisKey}:last_refill`;
//     const currentTime = Math.floor(Date.now() / 1000);
//     const statsKey = `stats:{${key}}`;          // per-user stats
// const globalStatsKey = `stats:{global}`;   // global stats


  
//     const lastRefill = await redis.get(lastRefillKey);
//     const lastRefillTime: number = lastRefill ? parseInt(lastRefill) : currentTime;

  
//     let currentCountStr = await redis.get(redisKey);
//     let currentCount: number = currentCountStr ? parseInt(currentCountStr) : limit;

//     const elapsed = currentTime - lastRefillTime;
//     const tokensToAdd = Math.floor(elapsed * refillRatePerSecond);
//     currentCount = Math.min(limit, currentCount + tokensToAdd);

  
//     if (currentCount < tokensRequested) {
//     let blocked=  await redis.hincrby(statsKey, 'blocked', 1);
//      let total= await redis.hincrby(statsKey, 'total', 1);
//       await redis.hincrby(globalStatsKey, 'blocked', 1);
//       await redis.hincrby(globalStatsKey, 'total', 1);
 
//       return {
//          allowed:false,
//         algorithmName: 'token_bucket',
//          tokensRemaining:currentCount,
   
//        // result stats per key
//          blockedRequests: blocked,
//          totalRequests:total,
//          allowedRequests:total - blocked,
//         retryAfterTime: Math.ceil((tokensRequested - currentCount) / refillRatePerSecond),
//       };
//     }

  
//     currentCount -= tokensRequested;
//     let allowed=await redis.hincrby(statsKey, 'allowed', 1);
//     let total= await redis.hincrby(statsKey, 'total', 1);
//     await redis.hincrby(globalStatsKey, 'allowed', 1);
//     await redis.hincrby(globalStatsKey, 'total', 1);
 
//     await redis.set(redisKey, currentCount);
//     await redis.set(lastRefillKey, currentTime.toString());

//     return {
//        allowed: true,
//         algorithmName: 'token_bucket',
//        tokensRemaining: currentCount,
     
//      // result stats per key
//        blockedRequests: total - allowed,
//        totalRequests: total,
//        allowedRequests: allowed,
//     };
//   } catch (err) {
//   console.error("Token Bucket Error:", err);

//   return {
//     allowed: true,
//      algorithmName: 'token_bucket',
//     tokensRemaining: limit,
//     blockedRequests: 0,
//     totalRequests: 0,
//     allowedRequests: 0,
//     };
//   }
// }

import { redis } from "../utils/redis.js";
import fs from "fs";
import path from "path";

let tokenBucketSHA: string | null = null;


async function loadTokenBucketScript() {
  if (!tokenBucketSHA) {
    const luaScript = fs.readFileSync(
      path.join(process.cwd(), "src/algo-lua/tokenBucket.lua"),
      "utf8"
    );

   tokenBucketSHA = await (redis as any).script("load", luaScript);

    console.log("Token Bucket Script SHA Loaded:", tokenBucketSHA);
  }
  return tokenBucketSHA;
}
export async function tokenBucketAlgorithm(
  key: string,
  limit: number,
  refillRatePerSecond: number,
  tokensRequested: number
) {
  await loadTokenBucketScript();

const redisKey = `token_bucket:{${key}}`;
const statsKey = `stats:{${key}}`;
const globalStatsKey = `stats:{${key}}:global`;

  const now = Math.floor(Date.now() / 1000);

  const raw:any = await redis.evalsha(
    tokenBucketSHA!,
    3,
    redisKey,
    statsKey,
    globalStatsKey,
    limit.toString(),
    refillRatePerSecond.toString(),
    now.toString(),
    tokensRequested.toString()
  );

  console.log("RAW REDIS RESULT:", raw);

  const allowed = raw[0] === 1;

  return {
    allowed,
    algorithmName: "token bucket",

    tokensRemaining: raw[1],
    retryAfterTime: raw[2],
    resetTime: raw[3],

    blockedRequests: raw[4],
    totalRequests: raw[5],
    allowedRequests: raw[6],
  };
}
