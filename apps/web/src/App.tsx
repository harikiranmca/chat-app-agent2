import { useEffect, useState } from 'react';
import './App.css';
import { getMessages, sendMessage } from './api';
import MessageForm from './components/MessageForm';
import MessageList from './components/MessageList';
import { Message } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      try {
        const data = await getMessages();
        if (!cancelled) {
          setMessages(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void fetchMessages();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSend(sender: string, content: string): Promise<void> {
    setSending(true);
    try {
      await sendMessage(sender, content);
      const data = await getMessages();
      setMessages(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      throw err;
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app">
      <h1>Chat App</h1>
      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}
      {loading ? (
        <p className="loading">Loading messages...</p>
      ) : (
        <MessageList messages={messages} />
      )}
      <MessageForm onSend={handleSend} isSending={sending} />
    </div>
  );
}

export default App;
