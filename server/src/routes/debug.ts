import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { Student } from '../models/Student';
import { Round1Score, Round2Score, Round3Score } from '../models/RoundScores';
import { FinalScore } from '../models/FinalScore';
import { ScoreAudit } from '../models/ScoreAudit';
import { User } from '../models/User';
import { ensureRoundsInitialized } from '../utils/seed';

const router = Router();
router.use(requireAuth);

router.get('/collections', async (_req, res) => {
  const db = mongoose.connection.db;
  if (!db) return res.status(503).json({ message: 'Database not connected' });
  const names = await db.listCollections().toArray();
  const list = names.map((c) => c.name).sort();
  const counts = await Promise.all([
    Student.countDocuments(),
    Round1Score.countDocuments(),
    Round2Score.countDocuments(),
    Round3Score.countDocuments(),
    FinalScore.countDocuments(),
    ScoreAudit.countDocuments(),
    User.countDocuments(),
  ]);
  res.json({
    database: db.databaseName,
    collections: list,
    counts: {
      students: counts[0],
      round1scores: counts[1],
      round2scores: counts[2],
      round3scores: counts[3],
      finalscores: counts[4],
      scoreaudits: counts[5],
      users: counts[6],
    },
  });
});

router.post('/seed', async (_req, res) => {
  await ensureRoundsInitialized();
  res.json({ ok: true });
});

export default router;
