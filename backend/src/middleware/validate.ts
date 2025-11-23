import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
    
      req.body = schema.parse(req.body);
      next();
    }catch (err) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.error,
    });
  }

  return res.status(500).json({ error: "Internal server error" });
}

  };
};
