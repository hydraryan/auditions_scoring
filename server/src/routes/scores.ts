import { Router } from 'express';
import { Student } from '../models/Student';
import { ScoreAudit } from '../models/ScoreAudit';
import { Round1Score, Round2Score, Round3Score } from '../models/RoundScores';
import { FinalScore } from '../models/FinalScore';
import { requireAuth, AuthRequest } from '../middleware/auth';
import XLSX from 'xlsx';

const router = Router();
router.use(requireAuth);

router.get('/round/:round', async (req, res) => {
  const round = Number(req.params.round) as 1 | 2 | 3;
  const students = await Student.find();
  const roundDocs =
    round === 1 ? await Round1Score.find() : round === 2 ? await Round2Score.find() : await Round3Score.find();
  const map = new Map(roundDocs.map((d: any) => [String(d.studentId), d]));
  const merged = students.map((s) => {
    const d = map.get(String(s._id));
    const scores = [1, 2, 3].map((r) =>
      r === round && d
        ? { round: r, aryan: (d as any).aryan || {}, kunal: (d as any).kunal || {} }
        : // default/fallback to keep shape
          (s.scores.find((x) => x.round === r) as any) || { round: r, aryan: {}, kunal: {} }
    );
    return { _id: s._id, name: s.name, uid: s.uid, contact: s.contact, scores };
  });
  res.json(merged);
});

router.put('/round/:round/student/:id', async (req: AuthRequest, res) => {
  const round = Number(req.params.round) as 1 | 2 | 3;
  const st = await Student.findById(req.params.id);
  if (!st) return res.status(404).json({ message: 'Student not found' });
  let doc =
    round === 1
      ? await Round1Score.findOne({ studentId: st._id })
      : round === 2
      ? await Round2Score.findOne({ studentId: st._id })
      : await Round3Score.findOne({ studentId: st._id });
  if (!doc) {
    const base: any = { studentId: st._id, studentUid: st.uid, round, aryan: {}, kunal: {} };
    doc =
      round === 1
        ? await Round1Score.create(base)
        : round === 2
        ? await Round2Score.create(base)
        : await Round3Score.create(base);
  }

  const isAryan = req.user?.username === 'Aryan';
  const entries = Object.entries(req.body || {});
  for (const [key, val] of entries) {
    const v = Number(val);
    if (Number.isNaN(v) || v < 0 || v > 10) return res.status(400).json({ message: 'Invalid score' });
    if (isAryan) {
      if (key === 'bodyExpressions') {
        const prev = (doc as any).aryan?.bodyExpressions || 0;
        (doc as any).aryan.bodyExpressions = v;
        await ScoreAudit.create({
          studentId: st._id,
          studentUid: st.uid,
          round,
          field: 'bodyExpressions',
          previous: prev,
          value: v,
          director: 'Aryan',
        });
      }
      if (key === 'confidence') {
        const prev = (doc as any).aryan?.confidence || 0;
        (doc as any).aryan.confidence = v;
        await ScoreAudit.create({
          studentId: st._id,
          studentUid: st.uid,
          round,
          field: 'confidence',
          previous: prev,
          value: v,
          director: 'Aryan',
        });
      }
    } else {
      if (key === 'dialogue') {
        const prev = (doc as any).kunal?.dialogue || 0;
        (doc as any).kunal.dialogue = v;
        await ScoreAudit.create({
          studentId: st._id,
          studentUid: st.uid,
          round,
          field: 'dialogue',
          previous: prev,
          value: v,
          director: 'Kunal',
        });
      }
      if (key === 'creativity') {
        const prev = (doc as any).kunal?.creativity || 0;
        (doc as any).kunal.creativity = v;
        await ScoreAudit.create({
          studentId: st._id,
          studentUid: st.uid,
          round,
          field: 'creativity',
          previous: prev,
          value: v,
          director: 'Kunal',
        });
      }
    }
  }
  await (doc as any).save();

  // Update Student embedded snapshot and totals for compatibility
  const embedded = st.scores.find((x) => x.round === round) as any;
  if (embedded) {
    embedded.aryan = (doc as any).aryan;
    embedded.kunal = (doc as any).kunal;
  }
  await st.save();
  res.json({ _id: st._id, name: st.name, uid: st.uid, contact: st.contact, scores: st.scores });
});

router.get('/final', async (_req, res) => {
  const [students, finals, r1, r2, r3] = await Promise.all([
    Student.find(),
    FinalScore.find(),
    Round1Score.find(),
    Round2Score.find(),
    Round3Score.find(),
  ]);
  const fMap = new Map(finals.map((f) => [String(f.studentId), f]));
  const r1Map = new Map(r1.map((d: any) => [String(d.studentId), d]));
  const r2Map = new Map(r2.map((d: any) => [String(d.studentId), d]));
  const r3Map = new Map(r3.map((d: any) => [String(d.studentId), d]));

  const sumDoc = (d: any) => {
    if (!d) return 0;
    const ar = d.aryan || {};
    const ku = d.kunal || {};
    const v = (x: any) => (typeof x === 'number' && !Number.isNaN(x) ? x : 0);
    return v(ar.bodyExpressions) + v(ar.confidence) + v(ku.dialogue) + v(ku.creativity);
  };

  const rows = students.map((s) => {
    const fs = fMap.get(String(s._id));
    const d1 = r1Map.get(String(s._id));
    const d2 = r2Map.get(String(s._id));
    const d3 = r3Map.get(String(s._id));
    const r1t = fs?.round1 ?? sumDoc(d1);
    const r2t = fs?.round2 ?? sumDoc(d2);
    const r3t = fs?.round3 ?? sumDoc(d3);
    const grandTotal = fs?.grandTotal ?? r1t + r2t + r3t;
    const average = fs?.average ?? grandTotal / 3;
    return {
      _id: s._id,
      name: s.name,
      uid: s.uid,
      contact: s.contact,
      round1: r1t,
      round2: r2t,
      round3: r3t,
      grandTotal,
      average,
    };
  });
  res.json(rows);
});

// Export Excel with rounds and final totals
router.get('/export.xlsx', async (_req, res) => {
  const [students, r1, r2, r3, finals] = await Promise.all([
    Student.find().sort({ name: 1 }),
    Round1Score.find(),
    Round2Score.find(),
    Round3Score.find(),
    FinalScore.find(),
  ]);
  const r1Map = new Map(r1.map((d: any) => [String(d.studentId), d]));
  const r2Map = new Map(r2.map((d: any) => [String(d.studentId), d]));
  const r3Map = new Map(r3.map((d: any) => [String(d.studentId), d]));
  const fMap = new Map(finals.map((f: any) => [String(f.studentId), f]));

  const rows = students.map((s) => {
    const d1: any = r1Map.get(String(s._id)) || {};
    const d2: any = r2Map.get(String(s._id)) || {};
    const d3: any = r3Map.get(String(s._id)) || {};
    const fs: any = fMap.get(String(s._id)) || {};
    const val = (n: any) => (typeof n === 'number' ? n : 0);
    return {
      Name: s.name,
      UID: s.uid,
      Contact: s.contact,
      // Round 1
      'R1 BodyExpressions': val(d1.aryan?.bodyExpressions),
      'R1 Confidence': val(d1.aryan?.confidence),
      'R1 Dialogue': val(d1.kunal?.dialogue),
      'R1 Creativity': val(d1.kunal?.creativity),
      'R1 Total': val(fs.round1),
      // Round 2
      'R2 BodyExpressions': val(d2.aryan?.bodyExpressions),
      'R2 Confidence': val(d2.aryan?.confidence),
      'R2 Dialogue': val(d2.kunal?.dialogue),
      'R2 Creativity': val(d2.kunal?.creativity),
      'R2 Total': val(fs.round2),
      // Round 3
      'R3 BodyExpressions': val(d3.aryan?.bodyExpressions),
      'R3 Confidence': val(d3.aryan?.confidence),
      'R3 Dialogue': val(d3.kunal?.dialogue),
      'R3 Creativity': val(d3.kunal?.creativity),
      'R3 Total': val(fs.round3),
      // Finals
      'Grand Total': val(fs.grandTotal),
      Average: val(fs.average),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Scores');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="scores_export.xlsx"');
  res.send(buf);
});

// Audit history for a student (optional round filter)
router.get('/audits/student/:id', async (req, res) => {
  const { id } = req.params;
  const round = req.query.round ? Number(req.query.round) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const filter: any = { studentId: id };
  if (round === 1 || round === 2 || round === 3) filter.round = round;
  const [items, total] = await Promise.all([
    ScoreAudit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ScoreAudit.countDocuments(filter),
  ]);
  res.json({ page, limit, total, items });
});

export default router;
// Export a specific round as Excel
router.get('/export/round/:round.xlsx', async (req, res) => {
  const round = Number(req.params.round) as 1 | 2 | 3;
  if (![1, 2, 3].includes(round)) return res.status(400).json({ message: 'Invalid round' });
  const [students, docs] = await Promise.all([
    Student.find().sort({ name: 1 }),
    round === 1 ? Round1Score.find() : round === 2 ? Round2Score.find() : Round3Score.find(),
  ]);
  const dMap = new Map(docs.map((d: any) => [String(d.studentId), d]));
  const val = (n: any) => (typeof n === 'number' ? n : 0);
  const rows = students.map((s) => {
    const d: any = dMap.get(String(s._id)) || {};
    const total = val(d.aryan?.bodyExpressions) + val(d.aryan?.confidence) + val(d.kunal?.dialogue) + val(d.kunal?.creativity);
    return {
      Name: s.name,
      UID: s.uid,
      Contact: s.contact,
      'BodyExpressions (Aryan)': val(d.aryan?.bodyExpressions),
      'Confidence (Aryan)': val(d.aryan?.confidence),
      'Dialogue (Kunal)': val(d.kunal?.dialogue),
      'Creativity (Kunal)': val(d.kunal?.creativity),
      'Round Total (40)': total,
    };
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, `Round${round}`);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="round${round}_scores.xlsx"`);
  res.send(buf);
});

