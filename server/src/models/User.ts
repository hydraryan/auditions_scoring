import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: 'Aryan' | 'Kunal' | string;
  passwordHash: string;
  role?: string;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
