import mongoose, { Schema, Document } from 'mongoose';

export interface IFinalScore extends Document {
  studentId: mongoose.Types.ObjectId;
  studentUid: string;
  round1: number;
  round2: number;
  round3: number;
  grandTotal: number;
  average: number;
  updatedAt: Date;
}

const FinalScoreSchema = new Schema<IFinalScore>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', unique: true, required: true },
    studentUid: { type: String, index: true },
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const FinalScore = mongoose.model<IFinalScore>('FinalScore', FinalScoreSchema);
