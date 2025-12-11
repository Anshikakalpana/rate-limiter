import { redis } from "../utils/redis.js";
import fs from "fs";
import path from "path";

let leakyBucketSHA: string | null = null;
let leakyBucketScript: string | null = null;

async function loadLeakyBucketScript() {
  if (!leakyBucketSHA) {
    leakyBucketScript = fs.readFileSync(
      path.join(process.cwd(), "src/algo-lua/leakyBucket.lua"),
      "utf8"
    );

    leakyBucketSHA = await (redis as any).script("load", leakyBucketScript);

    console.log("Leaky Bucket Script SHA Loaded:", leakyBucketSHA);
  }
  return leakyBucketSHA;
}

export async function leakyBucketAlgorithm(
  key: string,
  limit: number,
  leakRatePerSecond: number,
  tokensRequested: number
) {
  await loadLeakyBucketScript();

  const redisKey = `leaky_bucket:{${key}}`;
  const statsKey = `stats:{${key}}`;
  const globalStatsKey = `stats:{${key}}:global`;

  const now = Date.now(); 

  try {
    const raw: any = await redis.evalsha(
      leakyBucketSHA!,
      3,
      redisKey,
      statsKey,
      globalStatsKey,
      limit.toString(),
      leakRatePerSecond.toString(),
      tokensRequested.toString(),
      now.toString()
    );

    console.log("RAW REDIS RESULT:", raw);

    const allowed = raw[0] === 1;

    return {
      allowed,
      algorithmName: "leaky bucket",
      tokensRemaining: raw[1],
      retryAfterTime: raw[2],
      resetTime: raw[3],
      blockedRequests: raw[4],
      totalRequests: raw[5],
      allowedRequests: raw[6],
    };
  } catch (error: any) {

    if (error.message && error.message.includes('NOSCRIPT')) {
      console.log('Script not found on node, using EVAL instead');
      
      const raw: any = await redis.eval(
        leakyBucketScript!,
        3,
        redisKey,
        statsKey,
        globalStatsKey,
        limit.toString(),
        leakRatePerSecond.toString(),
        tokensRequested.toString(),
        now.toString()
      );

      console.log("RAW REDIS RESULT (EVAL):", raw);

      const allowed = raw[0] === 1;

      return {
        allowed,
        algorithmName: "leaky bucket",
        tokensRemaining: raw[1],
        retryAfterTime: raw[2],
        resetTime: raw[3],
        blockedRequests: raw[4],
        totalRequests: raw[5],
        allowedRequests: raw[6],
      };
    }
    throw error;
  }
}