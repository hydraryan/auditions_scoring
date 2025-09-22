import mongoose, { Schema, Document } from 'mongoose';

export interface IRoundScores {
  round: 1 | 2 | 3;
  aryan: { bodyExpressions?: number; confidence?: number };
  kunal: { dialogue?: number; creativity?: number };
}

export interface IStudent extends Document {
  name: string;
  uid: string;
  contact: string;
  scores: IRoundScores[];
  roundTotals?: {
    round1: number;
    round2: number;
    round3: number;
    grandTotal: number;
    average: number;
  };
}

const RoundSchema = new Schema<IRoundScores>({
  round: { type: Number, required: true },
  aryan: {
    bodyExpressions: { type: Number, min: 0, max: 10 },
    confidence: { type: Number, min: 0, max: 10 },
  },
  kunal: {
    dialogue: { type: Number, min: 0, max: 10 },
    creativity: { type: Number, min: 0, max: 10 },
  },
});

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    uid: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    scores: { type: [RoundSchema], default: [] },
    roundTotals: {
      round1: { type: Number, default: 0 },
      round2: { type: Number, default: 0 },
      round3: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compute totals before saving to persist a snapshot of current scores
StudentSchema.pre('save', function (next) {
  try {
    const s: any = this as any;
    const sumRound = (r: 1 | 2 | 3) => {
      const sc = (s.scores || []).find((x: any) => x.round === r) || {};
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
    s.roundTotals = { round1: r1, round2: r2, round3: r3, grandTotal, average };
    next();
  } catch (e) {
    next(e as any);
  }
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
