import mongoose, { Schema, Document } from 'mongoose';

export interface IScoreAudit extends Document {
  studentId: mongoose.Types.ObjectId;
  studentUid: string;
  round: 1 | 2 | 3;
  field: 'bodyExpressions' | 'confidence' | 'dialogue' | 'creativity';
  previous: number;
  value: number;
  director: 'Aryan' | 'Kunal';
  createdAt: Date;
}

const ScoreAuditSchema = new Schema<IScoreAudit>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true, required: true },
    studentUid: { type: String, index: true },
    round: { type: Number, required: true },
    field: { type: String, required: true },
    previous: { type: Number, required: true },
    value: { type: Number, required: true },
    director: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ScoreAuditSchema.index({ studentId: 1, round: 1, createdAt: -1 });

export const ScoreAudit = mongoose.model<IScoreAudit>('ScoreAudit', ScoreAuditSchema);
