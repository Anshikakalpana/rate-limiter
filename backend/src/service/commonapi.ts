import type { Request, Response } from 'express';
import type { Request as CustomRequest } from '../types/index.js';
import { fixedWindowAlgorithm } from '../algorithms/fixedWindow.js';
import { slidingWindowAlgorithm } from '../algorithms/slidingWindow.js';
import { tokenBucketAlgorithm } from '../algorithms/tokenBucket.js';
import { leakyBucketAlgorithm } from '../algorithms/leakyBucket.js';


export async function AllAlgorithms(req:Request , res: Response){

    const body = req.body as CustomRequest;
    const {key} = body;

    const [fixedWindowResult, slidingWindowResult, tokenBucketResult, leakyBucketResult] = await Promise.all([
        fixedWindowAlgorithm(key, body.limit, body.windowSize),
        slidingWindowAlgorithm(key, body.limit, body.windowSize),
        tokenBucketAlgorithm(key, body.limit, body.refillRatePerSecond, body.tokensRequested),
        leakyBucketAlgorithm(key, body.limit, body.leakRatePerSecond, body.tokensRequested)
    ]);

}