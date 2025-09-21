import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import studentsRouter from './routes/students';
import scoresRouter from './routes/scores';
import debugRouter from './routes/debug';
import { ensureRoundsInitialized } from './utils/seed';

dotenv.config();
if (!process.env.JWT_SECRET || !process.env.ARYAN_PASSWORD || !process.env.KUNAL_PASSWORD) {
  const rootEnv = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: rootEnv });
}

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auditions_scoring';
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureRoundsInitialized();
  })
  .catch((err) => console.error('MongoDB connection error', err));

app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/debug', debugRouter);

const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
