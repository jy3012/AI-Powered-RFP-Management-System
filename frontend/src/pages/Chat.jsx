import React from 'react';
import { FiMessageCircle, FiFileText, FiSend, FiUser, FiZap } from 'react-icons/fi';
import { chatAI } from '../api';

export default function Chat({ selectedRfp }) {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', text: 'Hi! I can help you refine your RFP ideas. Share what you need and I\'ll suggest improvements, missing details, or better wording.' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);
    
    try {
      // Get conversation history (last 10 messages for context)
      const conversationHistory = [...messages, { role: 'user', text: userMessage }].slice(-10);
      
      const response = await chatAI(conversationHistory);
      const assistantText = response?.message || 'Sorry, I couldn\'t generate a response. Please try again.';
      
      setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Error connecting to AI';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `Error: ${errorMsg}. Please check your API key and try again.` 
      }]);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="panel stack">
      <div>
        <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <FiMessageCircle />
          AI Chat Assistant
        </h2>
        <p className="muted" style={{fontSize: '15px', marginTop: '8px'}}>
          Get real-time help refining your RFP ideas. Ask for suggestions on missing details, better wording, industry best practices, or clarification on any aspect of your procurement process.
        </p>
        {selectedRfp && (
          <div className="tag" style={{
            marginTop: '12px',
            backgroundColor: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            borderColor: 'rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FiFileText size={14} />
            Active RFP: {selectedRfp.title}
          </div>
        )}
      </div>

      <div className="card" style={{
        maxHeight: '500px', 
        overflowY: 'auto', 
        padding: '20px', 
        backgroundColor: 'rgba(15,23,42,0.6)',
        borderColor: 'rgba(99,102,241,0.2)',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((m,i)=>(
          <div 
            key={i} 
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: m.role === 'assistant' 
                ? 'rgba(99,102,241,0.15)' 
                : 'rgba(30,41,59,0.6)',
              border: `1px solid ${m.role === 'assistant' 
                ? 'rgba(99,102,241,0.3)' 
                : 'rgba(148,163,184,0.2)'}`,
              transition: 'all 0.2s',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: m.role === 'assistant' 
                  ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                  : 'rgba(148,163,184,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                {m.role === 'assistant' ? (
                  <FiZap size={18} style={{color: '#fff'}} />
                ) : (
                  <FiUser size={18} style={{color: '#fff'}} />
                )}
              </div>
              <strong style={{
                color: m.role === 'assistant' ? '#a5b4fc' : '#cbd5e1',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {m.role === 'assistant' ? 'AI Assistant' : 'You'}
              </strong>
            </div>
            <div style={{
              color: '#e2e8f0', 
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontSize: '15px'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#94a3b8',
            fontStyle: 'italic'
          }}>
            <span className="loading" style={{width: '20px', height: '20px', borderWidth: '3px'}}></span>
            AI is thinking...
          </div>
        )}
      </div>

      <div className="row" style={{gap: '12px', alignItems: 'stretch'}}>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask for help refining your RFP, suggest missing details, improve wording, or get industry best practices..."
          disabled={loading}
          style={{
            flex: 1,
            minHeight: '60px',
            resize: 'none',
            padding: '14px 16px',
            fontSize: '15px'
          }}
          rows={2}
        />
        <button 
          className="button" 
          onClick={send} 
          disabled={loading || !input.trim()}
          style={{minWidth: '120px', alignSelf: 'flex-end'}}
        >
          {loading ? (
            <>
              <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
              Sending...
            </>
          ) : (
            <>
              <FiSend />
              Send
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

