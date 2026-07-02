import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return <p className="no-messages">No messages yet</p>;
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <article key={msg.id} className="message-item">
          <div className="message-header">
            <span className="message-sender">{msg.sender}</span>
            <time className="message-time">
              {new Date(msg.createdAt).toLocaleString()}
            </time>
          </div>
          <p className="message-content">{msg.content}</p>
        </article>
      ))}
    </div>
  );
}

export default MessageList;
