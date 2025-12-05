import {z} from 'zod';

// export const RateLimitConfigSchema = z.object({
//     algorithm: z.enum(['fixed_window', 'sliding_window', 'token_bucket']),
//     windowSize: z.number().positive(),
//     capacity: z.number().positive(),
//     limit: z.number().positive(),
//     refillRatePerSecond: z.number().positive(),

// });

export const RequestSchema = z.object({
    key: z.string().min(1).max(100), 
    limit: z.number().positive(),
    windowSize: z.number().positive().optional().default(60),
    algorithm: z.enum(['fixed_window', 'sliding_window', 'token_bucket', 'leaky_bucket']).default('token_bucket'),
    refillRatePerSecond: z.number().positive().optional().default(1),// For token bucket
    tokensRequested: z.number().positive().default(1),
    capacity: z.number().positive().optional().default(60), // For token bucket and leaky bucket
    leakRatePerSecond: z.number().positive().optional().default(1),// For leaky bucket
});

export const ResultSchema = z.object({
    allowed: z.boolean(),
    tokensRemaining: z.number().nonnegative(),
    resetTime: z.number().nonnegative().optional(),
    retryAfterTime: z.number().nonnegative().optional(),
     blockedRequests: z.number().nonnegative().optional(),
});

export const ResponseSchema = z.object({
    activeKeys: z.number().nonnegative(),
    response: ResultSchema,
    totalRequests: z.number().nonnegative(),
    allowedRequests: z.number().nonnegative(),
   

});

// export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type Request = z.infer<typeof RequestSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type Response = z.infer<typeof ResponseSchema>;
