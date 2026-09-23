import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../api/api';
import { AppLayout } from '../components/Layout';
import { Send, Loader2, Bot, User, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'What is Melanoma?',
  'What is Basal Cell Carcinoma?',
  'what is Actinic Keratosis?',
  'What is Melanocytic Nevi?',
];

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hi! I am the DermaVision screening assistant. I can answer questions about skin lesion types, what your screening result means, and general skin health information. I cannot provide medical diagnoses  always consult a qualified dermatologist for medical advice.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await chatAPI.send(msg);
      const reply = data.reply || data.response || data.message || data.answer || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again.',
        error: true,
      }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
        <p className="page-sub">Ask questions about skin lesions, screening results, or general skin health</p>
      </div>

      {/* Educational label */}
      <div className="chat-edu-label">
        <Info size={13} />
        AI assistant — educational and screening information only. Not a substitute for medical advice.
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-row ${m.role}`}>
              <div className="chat-avatar">
                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`chat-bubble ${m.error ? 'error' : ''} ${m.role === 'assistant' ? 'markdown-bubble' : ''}`}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p style={{ margin:'0 0 8px 0', lineHeight:1.6 }}>{children}</p>,
                      strong: ({children}) => <strong style={{ color:'var(--text)', fontWeight:600 }}>{children}</strong>,
                      ul: ({children}) => <ul style={{ paddingLeft:18, margin:'6px 0' }}>{children}</ul>,
                      ol: ({children}) => <ol style={{ paddingLeft:18, margin:'6px 0' }}>{children}</ol>,
                      li: ({children}) => <li style={{ marginBottom:4, lineHeight:1.5 }}>{children}</li>,
                      h1: ({children}) => <h1 style={{ fontSize:15, fontWeight:700, margin:'10px 0 6px', color:'var(--text)' }}>{children}</h1>,
                      h2: ({children}) => <h2 style={{ fontSize:14, fontWeight:600, margin:'10px 0 4px', color:'var(--text)' }}>{children}</h2>,
                      h3: ({children}) => <h3 style={{ fontSize:13, fontWeight:600, margin:'8px 0 4px', color:'var(--text2)' }}>{children}</h3>,
                      code: ({children}) => <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 5px', borderRadius:4, fontSize:12, fontFamily:'monospace' }}>{children}</code>,
                      blockquote: ({children}) => <blockquote style={{ borderLeft:'3px solid var(--accent)', paddingLeft:10, margin:'6px 0', color:'var(--text2)' }}>{children}</blockquote>,
                      table: ({children}) => <table style={{ borderCollapse:'collapse', width:'100%', margin:'8px 0', fontSize:12 }}>{children}</table>,
                      th: ({children}) => <th style={{ border:'1px solid rgba(255,255,255,0.1)', padding:'4px 8px', background:'rgba(255,255,255,0.05)', textAlign:'left' }}>{children}</th>,
                      td: ({children}) => <td style={{ border:'1px solid rgba(255,255,255,0.1)', padding:'4px 8px' }}>{children}</td>,
                      hr: () => <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.08)', margin:'8px 0' }} />,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-row assistant">
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {messages.length < 3 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-wrap">
          <textarea
            className="chat-input"
            placeholder="Ask about skin lesions, screening results, or skin health…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}