// Reset or create default users Aryan/Kunal with known passwords.
// Usage: node server/scripts/reset-users.js
// Optional env: MONGODB_URI, JWT_SECRET, ARYAN_PASSWORD, KUNAL_PASSWORD

const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auditions_scoring';
const JWT_SECRET = process.env.JWT_SECRET || 'salt';
const ARYAN_PASSWORD = process.env.ARYAN_PASSWORD || 'aryan123';
const KUNAL_PASSWORD = process.env.KUNAL_PASSWORD || 'kunal123';

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String },
});
const User = mongoose.model('User', UserSchema);

function hash(pwd) {
  return crypto.createHash('sha256').update(`${pwd}:${JWT_SECRET}`).digest('hex');
}

(async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  await User.updateOne(
    { username: 'Aryan' },
    { $set: { passwordHash: hash(ARYAN_PASSWORD), role: 'director' } },
    { upsert: true }
  );
  await User.updateOne(
    { username: 'Kunal' },
    { $set: { passwordHash: hash(KUNAL_PASSWORD), role: 'director' } },
    { upsert: true }
  );
  console.log('Users reset.');
  await mongoose.disconnect();
  process.exit(0);
})();
