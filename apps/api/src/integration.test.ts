import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { Db } from 'mongodb';
import { app } from './index.js';
import { connectDb, closeDb } from './db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
let db: Db;

beforeAll(async () => {
  db = await connectDb(MONGODB_URI);
});

beforeEach(async () => {
  await db.collection('messages').deleteMany({});
});

afterAll(async () => {
  await closeDb();
});

describe('POST /messages', () => {
  it('creates a message and returns 201 with the correct shape', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ sender: 'Alice', content: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toMatch(/^[a-f0-9]{24}$/);
    expect(res.body.sender).toBe('Alice');
    expect(res.body.content).toBe('Hello');
    expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const docs = await db.collection('messages').find().toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0].sender).toBe('Alice');
  });

  it('returns 400 when sender is missing', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ content: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when sender is empty after trim', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ sender: '   ', content: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ sender: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when content is empty after trim', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ sender: 'Alice', content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/messages')
      .set('Content-Type', 'application/json')
      .send('not json at all{');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('ignores extra fields in the body', async () => {
    const res = await request(app)
      .post('/messages')
      .send({ sender: 'Bob', content: 'Test', extra: 'ignored' });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('extra');
    expect(res.body.sender).toBe('Bob');
    expect(res.body.content).toBe('Test');
  });
});

describe('GET /messages', () => {
  it('returns empty array when no messages exist', async () => {
    const res = await request(app).get('/messages');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns messages in chronological order', async () => {
    await request(app).post('/messages').send({ sender: 'A', content: 'First' });
    await request(app).post('/messages').send({ sender: 'B', content: 'Second' });
    await request(app).post('/messages').send({ sender: 'C', content: 'Third' });

    const res = await request(app).get('/messages');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].content).toBe('First');
    expect(res.body[1].content).toBe('Second');
    expect(res.body[2].content).toBe('Third');
  });

  it('returns correct shape for each message', async () => {
    await request(app).post('/messages').send({ sender: 'Alice', content: 'Hello' });

    const res = await request(app).get('/messages');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const msg = res.body[0];
    expect(msg).toHaveProperty('id');
    expect(msg).toHaveProperty('sender');
    expect(msg).toHaveProperty('content');
    expect(msg).toHaveProperty('createdAt');
    expect(msg).not.toHaveProperty('_id');
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
