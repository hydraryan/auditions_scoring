import { Router } from 'express';
import { Student } from '../models/Student';

const router = Router();

// Simple ping for diagnostics
router.get('/ping', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Ingest a single student record from Google Forms / external systems
// Auth: X-Ingest-Token header must match process.env.INGEST_TOKEN
router.post('/students/ingest', async (req, res) => {
  try {
    const token = (req.headers['x-ingest-token'] || req.query.token) as string | undefined;
    if (!process.env.INGEST_TOKEN) {
      return res.status(500).json({ message: 'INGEST_TOKEN not configured on server' });
    }
    if (!token || token !== process.env.INGEST_TOKEN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, uid, contact } = req.body as { name?: string; uid?: string; contact?: string };
    if (!name || !uid) return res.status(400).json({ message: 'Missing name or uid' });

    // Upsert student by UID, ensure scores array is present
    const baseScores = [1, 2, 3].map((r) => ({ round: r })) as any[];
    const result = await Student.updateOne(
      { uid },
      {
        $setOnInsert: { name, uid, contact: contact || '', scores: baseScores },
        $set: { name, contact: contact || '' },
      },
      { upsert: true }
    );

    return res.json({ ok: true, upserted: result.upsertedCount === 1, uid });
  } catch (err: any) {
    return res.status(500).json({ message: 'Ingest error', error: String(err?.message || err) });
  }
});

export default router;
