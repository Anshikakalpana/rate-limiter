

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
