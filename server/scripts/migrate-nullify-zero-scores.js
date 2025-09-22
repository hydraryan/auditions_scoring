// Convert default 0 scores to null to correctly mark unscored entries
// Usage: node server/scripts/migrate-nullify-zero-scores.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auditions_scoring';

(async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  const Student = mongoose.model(
    'Student',
    new mongoose.Schema({
      scores: [
        new mongoose.Schema({
          round: Number,
          aryan: { bodyExpressions: Number, confidence: Number },
          kunal: { dialogue: Number, creativity: Number },
        }),
      ],
    })
  );

  const cursor = Student.find().cursor();
  let updated = 0;
  for (let s = await cursor.next(); s; s = await cursor.next()) {
    let changed = false;
    for (const sc of s.scores || []) {
      if (sc.aryan) {
        if (sc.aryan.bodyExpressions === 0) { sc.aryan.bodyExpressions = undefined; changed = true; }
        if (sc.aryan.confidence === 0) { sc.aryan.confidence = undefined; changed = true; }
      }
      if (sc.kunal) {
        if (sc.kunal.dialogue === 0) { sc.kunal.dialogue = undefined; changed = true; }
        if (sc.kunal.creativity === 0) { sc.kunal.creativity = undefined; changed = true; }
      }
    }
    if (changed) { await s.save(); updated++; }
  }
  console.log('Updated documents:', updated);
  await mongoose.disconnect();
})();
