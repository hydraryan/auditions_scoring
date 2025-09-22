import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { Student } from '../models/Student';
import { requireAuth } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const students = await Student.find().sort({ name: 1 });
  res.json(students);
});

router.post('/', async (req, res) => {
  const { name, uid, contact } = req.body as any;
  if (!name || !uid || !contact) return res.status(400).json({ message: 'Missing fields' });
  const exists = await Student.findOne({ uid });
  if (exists) return res.status(409).json({ message: 'UID already exists' });
  const st = await Student.create({ name, uid, contact, scores: [1, 2, 3].map((r) => ({ round: r })) });
  res.status(201).json(st);
});

router.put('/:id', async (req, res) => {
  const { name, uid, contact } = req.body as any;
  const st = await Student.findByIdAndUpdate(
    req.params.id,
    { name, uid, contact },
    { new: true }
  );
  if (!st) return res.status(404).json({ message: 'Not found' });
  res.json(st);
});

router.delete('/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File required' });
  const mime = req.file.mimetype;
  let rows: Array<{ Name: string; UID: string; Contact: string }> = [];
  try {
    if (mime.includes('csv')) {
      const text = req.file.buffer.toString('utf-8');
      rows = parse(text, { columns: true, skip_empty_lines: true });
    } else if (mime.includes('excel') || mime.includes('spreadsheet')) {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws);
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    for (const r of rows) {
      if (!r.UID) continue;
      await Student.updateOne(
        { uid: r.UID },
        {
          $setOnInsert: {
            uid: r.UID,
            scores: [1, 2, 3].map((rd) => ({ round: rd })),
          },
          $set: {
            name: r.Name || 'Unknown',
            contact: r.Contact || '',
          },
        },
        { upsert: true }
      );
    }
    res.json({ count: rows.length });
  } catch (e) {
    res.status(400).json({ message: 'Parse error' });
  }
});

// Quick bulk add via comma-separated text
// Accepts JSON body: { text: string }
// Each entry can be on a new line or separated by semicolons; fields separated by commas:
//   Name, UID, Contact(optional)
router.post('/bulk-text', async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) return res.status(400).json({ message: 'Text required' });
  const entries = text
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  let processed = 0;
  let upserts = 0;
  let skipped = 0;
  for (const line of entries) {
    processed++;
    const parts = line
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length < 2) {
      skipped++;
      continue; // need at least Name, UID
    }
    const [name, uid, contact] = parts as [string, string, string?];
    if (!uid) { skipped++; continue; }
    const result = await Student.updateOne(
      { uid },
      {
        $setOnInsert: {
          uid,
          scores: [1, 2, 3].map((rd) => ({ round: rd })),
        },
        $set: {
          name: name || 'Unknown',
          contact: contact || '',
        },
      },
      { upsert: true }
    );
    if ((result as any).upsertedCount === 1) upserts++;
  }
  res.json({ processed, upserts, skipped });
});

export default router;
