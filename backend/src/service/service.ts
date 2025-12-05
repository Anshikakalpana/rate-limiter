// add dry principle
import type { Request, Response } from 'express';
import type { Request as CustomRequest } from '../types/index.js';
import { fixedWindowAlgorithm } from '../algorithms/fixedWindow.js';
import { slidingWindowAlgorithm } from '../algorithms/slidingWindow.js';
import { tokenBucketAlgorithm } from '../algorithms/tokenBucket.js';


export async function fixedwindowalgo(req: Request, res: Response) {
  try {
   
    const { key , limit , windowSize } = req.body as CustomRequest;

    const result = await fixedWindowAlgorithm(key,  limit, windowSize);

   
    const statusCode = result.allowed ? 200 : 429;
    
    return res.status(statusCode).json({
      ...result,
      algorithm: 'fixed_window',
      timestamp: Date.now(),
    });

  } catch (err) {
    console.error('Service Error:', err);
    return res.status(500).json({
      error: 'Internal server error',
    
    });
  }
}

export async function slidingWindowAlgo(req:Request , res:Response){
  try{
 const { key , limit , windowSize } = req.body as CustomRequest;
   const result = await slidingWindowAlgorithm(key,  limit, windowSize);

   
    const statusCode = result.allowed ? 200 : 429;
    
    return res.status(statusCode).json({
      ...result,
      algorithm: 'sliding window',
      timestamp: Date.now(),
    });

  } catch (err) {
    console.error('Service Error:', err);
    return res.status(500).json({
      error: 'Internal server error',
   
    });
  }
}


export async function tokenBucketAlgo(req:Request , res: Response){

  try{
  const { key,limit ,refillRatePerSecond, tokensRequested } = req.body as CustomRequest;

  console.log("BODY RECEIVED:", req.body);

const result = await tokenBucketAlgorithm(key, limit, refillRatePerSecond, tokensRequested);


   
    const statusCode = result.allowed ? 200 : 429;
    
    return res.status(statusCode).json({
      ...result,
      algorithm: 'token bucket',
      timestamp: Date.now(),
    });

  } catch (err) {
    console.error('Service Error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      
    });
  }
}
