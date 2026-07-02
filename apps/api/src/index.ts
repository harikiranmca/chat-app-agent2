import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = parseInt(process.env.PORT_API || '3001', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

async function start(): Promise<void> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

// Only start the server when this file is the main entry point
const isMainModule = process.argv[1]?.includes('index');
if (isMainModule && !process.env.VITEST) {
  start();
}

export { app };
