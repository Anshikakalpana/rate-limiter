import {z} from 'zod';

export const RateLimitConfigSchema = z.object({
    algorithm: z.enum(['fixed_window', 'sliding_window', 'token_bucket']),
    windowSize: z.number().positive(),
    capacity: z.number().positive(),
    refillRatePerSecond: z.number().positive(),

});

export const RequestSchema = z.object({

    key: z.string().min(1).max(100),
    algorithm:z.string().optional(),
    tokensRequested: z.number().positive().default(1),
});

export const ResultSchema = z.object({
    allowed: z.boolean(),
    tokensRemaining: z.number().nonnegative(),
    resetTime: z.number().nonnegative().optional(),
    retryAfterTime: z.number().nonnegative().optional(),
});

export const ResponseSchema = z.object({
    activeKeys: z.number().nonnegative(),
    response: ResultSchema,
    totalRequests: z.number().nonnegative(),
    allowedRequests: z.number().nonnegative(),
    blockedRequests: z.number().nonnegative(),

});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type Request = z.infer<typeof RequestSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type Response = z.infer<typeof ResponseSchema>;
