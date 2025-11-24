import type { Request, Response } from 'express';
import type { Request as CustomRequest } from '../types/index.js';
import { fixedWindowAlgorithm } from '../algorithms/fixedWindow.js';

export async function fixedwindowalgo(req: Request, res: Response) {
  try {
   
    const { key, tokensRequested } = req.body as CustomRequest;

    const result = await fixedWindowAlgorithm(key,  10, 60);

   
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
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}