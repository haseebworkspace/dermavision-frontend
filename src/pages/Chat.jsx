import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { Send, Loader2, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  'What is Melanoma?',
  'What does a high confidence score mean?',
  'How does MobileNetV2 work?',
  'What is the HAM10000 dataset?',
];

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm the DermaVision assistant. Ask me anything about skin cancer types, the AI model, or how to interpret your scan results.",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await chatAPI.send(msg);
      // Backend may return { reply, response, message, answer }
      const reply = data.reply || data.response || data.message || data.answer || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.', error: true }]);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
        <p className="page-sub">Ask questions about skin cancer, the model, or your results</p>
      </div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-row ${m.role}`}>
              <div className="chat-avatar">
                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`chat-bubble ${m.error ? 'error' : ''}`}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-row assistant">
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length < 3 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        <div className="chat-input-wrap">
          <textarea className="chat-input" placeholder="Ask a question…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1} />
          <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
