import type { Request, Response } from "express";
import type { Request as CustomRequest } from "../types/index.js";

import { fixedWindowAlgorithm } from "../algorithms/fixedWindow.js";
import { slidingWindowAlgorithm } from "../algorithms/slidingWindow.js";
import { tokenBucketAlgorithm } from "../algorithms/tokenBucket.js";
import { leakyBucketAlgorithm } from "../algorithms/leakyBucket.js";

export async function AllAlgorithms(req: Request, res: Response) {
  try {
    const body = req.body as CustomRequest;
    const { key } = body;

    const [
      fixedWindowResult,
      slidingWindowResult,
      tokenBucketResult,
      leakyBucketResult
    ] = await Promise.all([
      fixedWindowAlgorithm(key, body.limit, body.windowSize),
      slidingWindowAlgorithm(key, body.limit, body.windowSize , body.tokensRequested),
      tokenBucketAlgorithm(
        key,
        body.limit,
        body.refillRatePerSecond,
        body.tokensRequested
      ),
      leakyBucketAlgorithm(
        key,
        body.limit,
        body.leakRatePerSecond,
        body.tokensRequested
      )
    ]);

    const comparison = {
      activeKeys: 1,

      response: {
        fixedWindow: fixedWindowResult,
        slidingWindow: slidingWindowResult,
        tokenBucket: tokenBucketResult,
        leakyBucket: leakyBucketResult
      },

      blockedRequests:
        fixedWindowResult.blockedRequests +
        slidingWindowResult.blockedRequests +
        tokenBucketResult.blockedRequests +
        leakyBucketResult.blockedRequests,

      allowedRequests:
        fixedWindowResult.allowedRequests +
        slidingWindowResult.allowedRequests +
        tokenBucketResult.allowedRequests +
        leakyBucketResult.allowedRequests,

      totalRequests:
        fixedWindowResult.totalRequests +
        slidingWindowResult.totalRequests +
        tokenBucketResult.totalRequests +
        leakyBucketResult.totalRequests
    };

    return res.status(200).json(comparison);
  } catch (err) {
    console.error("AllAlgorithms error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
