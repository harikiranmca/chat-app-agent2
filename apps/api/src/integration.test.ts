import { describe, it, expect, afterAll } from 'vitest';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

let client: MongoClient;

afterAll(async () => {
  if (client) {
    await client.close();
  }
});

describe('MongoDB integration', () => {
  it('connects to MongoDB and pings successfully', async () => {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const result = await client.db().command({ ping: 1 });
    expect(result.ok).toBe(1);
  });
});
