import { Message } from './types';

const rawUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = rawUrl.replace(/\/+$/, '');

export async function getMessages(): Promise<Message[]> {
  const res = await fetch(`${API_URL}/messages`);
  if (!res.ok) {
    throw new Error('Failed to load messages');
  }
  return res.json() as Promise<Message[]>;
}

export async function sendMessage(sender: string, content: string): Promise<Message> {
  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, content }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: 'Failed to send message' }))) as { error?: string };
    throw new Error(body.error || 'Failed to send message');
  }
  return res.json() as Promise<Message>;
}
