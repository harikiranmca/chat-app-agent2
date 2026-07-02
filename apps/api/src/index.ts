import express, { Request, Response, NextFunction } from 'express';
import { connectDb, closeDb } from './db.js';
import { messagesRouter } from './messages.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/messages', messagesRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT_API || '3001', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

async function start(): Promise<void> {
  try {
    await connectDb(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

const isMainModule = process.argv[1]?.includes('index');
if (isMainModule && !process.env.VITEST) {
  start();
}

export { app, connectDb, closeDb };
