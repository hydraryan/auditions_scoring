import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { username: 'Aryan' | 'Kunal' };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
  const [, token] = header.split(' ');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me') as any;
    req.user = { username: payload.username };
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
