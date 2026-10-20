import "dotenv/config"
import mongoose from 'mongoose';
import { createApp } from './app.js';

const { MONGO_URI = 'mongodb://localhost:27017/safeflow', PORT = 5000 } = process.env;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Copy .env.example to .env and set it.');
  process.exit(1);
}


await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
console.log('MongoDB connected');

const server = createApp().listen(PORT, () => console.log(`SafeFlow API listening on :${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
}
