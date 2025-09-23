import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../utils/validate';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const hash = crypto.createHash('sha256').update(`${password}:${process.env.JWT_SECRET || 'salt'}`).digest('hex');
  if (hash !== user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'change-me', {
    expiresIn: '12h',
  });
  res.json({ token });
});

// Change password for the logged-in user
const changePwdSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.put('/change-password', requireAuth, validate(changePwdSchema), async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

  const username = req.user?.username;
  if (!username) return res.status(401).json({ message: 'Unauthorized' });
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const makeHash = (pwd: string) =>
    crypto.createHash('sha256').update(`${pwd}:${process.env.JWT_SECRET || 'salt'}`).digest('hex');
  const currentHash = makeHash(oldPassword);
  if (currentHash !== user.passwordHash) return res.status(401).json({ message: 'Invalid current password' });

  user.passwordHash = makeHash(newPassword);
  await user.save();
  return res.json({ ok: true });
});

export default router;
