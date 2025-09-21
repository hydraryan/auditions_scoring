import { Student } from '../models/Student';
import { Round1Score, Round2Score, Round3Score } from '../models/RoundScores';
import { FinalScore } from '../models/FinalScore';
import { User } from '../models/User';
import crypto from 'crypto';

export async function ensureRoundsInitialized() {
  const students = await Student.find();
  for (const s of students) {
    let mutated = false;
    const rounds = new Set(s.scores.map((x) => x.round));
    for (const r of [1, 2, 3] as const) {
      if (!rounds.has(r)) {
        s.scores.push({ round: r, aryan: {}, kunal: {} } as any);
        mutated = true;
      }
    }

    // compute totals for backfill
    const sumRound = (r: 1 | 2 | 3) => {
      const sc: any = (s.scores || []).find((x: any) => x.round === r) || {};
      const ar = sc.aryan || {};
      const ku = sc.kunal || {};
      const toNum = (n: any) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0);
      return toNum(ar.bodyExpressions) + toNum(ar.confidence) + toNum(ku.dialogue) + toNum(ku.creativity);
    };
    const r1 = sumRound(1);
    const r2 = sumRound(2);
    const r3 = sumRound(3);
    const grandTotal = r1 + r2 + r3;
    const average = grandTotal / 3;
    const newTotals = { round1: r1, round2: r2, round3: r3, grandTotal, average } as any;
    const currTotals = (s as any).roundTotals || {};
    const changed =
      currTotals.round1 !== newTotals.round1 ||
      currTotals.round2 !== newTotals.round2 ||
      currTotals.round3 !== newTotals.round3 ||
      currTotals.grandTotal !== newTotals.grandTotal ||
      currTotals.average !== newTotals.average;
    if (changed) {
      (s as any).roundTotals = newTotals;
      mutated = true;
    }

    if (mutated) {
      await s.save();
    }

    // Upsert per-round collections
    const ensureRound = async (round: 1 | 2 | 3) => {
      const sc: any = (s.scores || []).find((x: any) => x.round === round) || { aryan: {}, kunal: {} };
      const doc = {
        studentId: s._id,
        studentUid: s.uid,
        round,
        aryan: sc.aryan || {},
        kunal: sc.kunal || {},
      } as any;
      if (round === 1) await Round1Score.updateOne({ studentId: s._id }, { $set: doc }, { upsert: true });
      if (round === 2) await Round2Score.updateOne({ studentId: s._id }, { $set: doc }, { upsert: true });
      if (round === 3) await Round3Score.updateOne({ studentId: s._id }, { $set: doc }, { upsert: true });
    };
    await ensureRound(1);
    await ensureRound(2);
    await ensureRound(3);

    // Upsert FinalScore
    await FinalScore.updateOne(
      { studentId: s._id },
      { $set: { studentUid: s.uid, ...((s as any).roundTotals || {}) } },
      { upsert: true }
    );
  }

  // Seed default users if missing using env passwords
  const aryanPass = process.env.ARYAN_PASSWORD || 'aryan123';
  const kunalPass = process.env.KUNAL_PASSWORD || 'kunal123';
  const hash = (plain: string) =>
    crypto.createHash('sha256').update(`${plain}:${process.env.JWT_SECRET || 'salt'}`).digest('hex');
  await User.updateOne(
    { username: 'Aryan' },
    { $setOnInsert: { passwordHash: hash(aryanPass), role: 'director' } },
    { upsert: true }
  );
  await User.updateOne(
    { username: 'Kunal' },
    { $setOnInsert: { passwordHash: hash(kunalPass), role: 'director' } },
    { upsert: true }
  );
}
