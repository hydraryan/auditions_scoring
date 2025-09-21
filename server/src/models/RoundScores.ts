import mongoose, { Schema, Document } from 'mongoose';

type AryanFields = { bodyExpressions?: number; confidence?: number };
type KunalFields = { dialogue?: number; creativity?: number };

interface BaseRoundScore extends Document {
  studentId: mongoose.Types.ObjectId;
  studentUid: string;
  round: 1 | 2 | 3;
  aryan: AryanFields;
  kunal: KunalFields;
  createdAt: Date;
  updatedAt: Date;
}

const makeSchema = () =>
  new Schema<BaseRoundScore>(
    {
      studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true, required: true },
      studentUid: { type: String, index: true },
      round: { type: Number, required: true },
      aryan: {
        bodyExpressions: { type: Number, min: 0, max: 10, default: 0 },
        confidence: { type: Number, min: 0, max: 10, default: 0 },
      },
      kunal: {
        dialogue: { type: Number, min: 0, max: 10, default: 0 },
        creativity: { type: Number, min: 0, max: 10, default: 0 },
      },
    },
    { timestamps: true }
  );

const Round1ScoreSchema = makeSchema();
const Round2ScoreSchema = makeSchema();
const Round3ScoreSchema = makeSchema();

export const Round1Score = mongoose.model<BaseRoundScore>('Round1Score', Round1ScoreSchema);
export const Round2Score = mongoose.model<BaseRoundScore>('Round2Score', Round2ScoreSchema);
export const Round3Score = mongoose.model<BaseRoundScore>('Round3Score', Round3ScoreSchema);
