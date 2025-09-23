import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema<any>, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as any)[source]);
    if (!result.success) {
      const err = result.error.flatten();
      return res.status(400).json({ message: 'Invalid request', errors: err });
    }
    (req as any)[source] = result.data;
    next();
  };
}
