import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from './db.js';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sender, content } = req.body ?? {};

    if (typeof sender !== 'string' || sender.trim() === '') {
      res.status(400).json({ error: 'sender is required and must be a non-empty string' });
      return;
    }

    if (typeof content !== 'string' || content.trim() === '') {
      res.status(400).json({ error: 'content is required and must be a non-empty string' });
      return;
    }

    const createdAt = new Date();
    const doc = { sender: sender.trim(), content: content.trim(), createdAt };
    const result = await getDb().collection('messages').insertOne(doc);

    res.status(201).json({
      id: result.insertedId.toHexString(),
      sender: doc.sender,
      content: doc.content,
      createdAt: createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await getDb().collection('messages').find().sort({ createdAt: 1 }).toArray();
    const messages = docs.map((doc) => ({
      id: doc._id.toHexString(),
      sender: doc.sender as string,
      content: doc.content as string,
      createdAt: (doc.createdAt as Date).toISOString(),
    }));
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

export { router as messagesRouter };
