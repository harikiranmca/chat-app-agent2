import { FormEvent, KeyboardEvent, useState } from 'react';

interface MessageFormProps {
  onSend: (sender: string, content: string) => Promise<void>;
  isSending: boolean;
}

function MessageForm({ onSend, isSending }: MessageFormProps) {
  const [sender, setSender] = useState('');
  const [content, setContent] = useState('');

  const canSend = sender.trim().length > 0 && content.trim().length > 0 && !isSending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    try {
      await onSend(sender.trim(), content.trim());
      setContent('');
    } catch {
      // error is handled by parent via onSend rejection
    }
  }

  function handleContentKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        void handleSubmit(e as unknown as FormEvent);
      }
    }
  }

  return (
    <form className="message-form" onSubmit={(e) => void handleSubmit(e)}>
      <input
        type="text"
        className="input-sender"
        placeholder="Your name"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
        aria-label="Sender name"
      />
      <input
        type="text"
        className="input-content"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleContentKeyDown}
        aria-label="Message content"
      />
      <button type="submit" disabled={!canSend}>
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

export default MessageForm;
