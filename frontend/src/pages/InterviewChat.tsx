import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  score?: number;
}

interface Question {
  question: string;
  difficulty: string;
  turn: number;
}

const InterviewChat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentQuestion]);

  useEffect(() => {
    const state = location.state as { question?: string; difficulty?: string } | null;
    if (state?.question) {
      setCurrentQuestion({
        question: state.question,
        difficulty: state.difficulty || 'medium',
        turn: 1,
      });
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !sessionId || !currentQuestion) return;

    const submittedAnswer = answer;
    setAnswer('');
    setSubmitting(true);

    setHistory(prev => [...prev, { role: 'user', content: submittedAnswer }]);

    try {
      const res = await api.submitAnswer(sessionId, { answer: submittedAnswer });
      const data = res.data;

      setHistory(prev => [
        ...prev,
        {
          role: 'ai',
          content: data.feedback || 'No feedback provided.',
          score: typeof data.score === 'number' ? Math.round(data.score * 10) : undefined,
        },
      ]);

      if (data.is_complete) {
        setTimeout(() => navigate(`/interview/${sessionId}/summary`), 1500);
      } else {
        setCurrentQuestion({
          question: data.next_question,
          difficulty: data.difficulty || 'medium',
          turn: data.turn_count + 1,
        });
      }
    } catch (err: any) {
      console.error(err);
      setHistory(prev => [
        ...prev,
        { role: 'ai', content: '⚠️ ' + (err.response?.data?.detail || 'Failed to process your answer. Please try again.') },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, backgroundColor: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="white" strokeWidth="1.2"/><path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)' }}>AI Interviewer</p>
            {currentQuestion && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-muted)' }}>Difficulty: {currentQuestion.difficulty}</p>}
          </div>
        </div>
        {currentQuestion && <span className="el-badge">Turn {currentQuestion.turn}</span>}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {history.length === 0 && !currentQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', color: 'var(--text-muted)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>Loading your first question...</p>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', alignItems: 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="white" strokeWidth="1.3"/><path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
            )}
            <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-card)', border: msg.role === 'ai' ? '1px solid var(--border)' : 'none', color: msg.role === 'user' ? 'white' : 'var(--text-h)', fontFamily: 'Inter, sans-serif', fontSize: '15px', lineHeight: 1.55 }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              {msg.role === 'ai' && msg.score !== undefined && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-muted)' }}>Score</span>
                  <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '18px', fontWeight: 300, color: msg.score >= 8 ? '#16a34a' : msg.score >= 5 ? '#b45309' : '#dc2626' }}>{msg.score}/10</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Current question */}
        {currentQuestion && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="white" strokeWidth="1.3"/><path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: '18px 18px 18px 4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-h)', fontFamily: 'Inter, sans-serif', fontSize: '15px', lineHeight: 1.55, fontWeight: 500 }}>
              {currentQuestion.question}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {submitting && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="white" strokeWidth="1.3"/><path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'bounceDot 1.4s ease infinite', animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0, backgroundColor: 'var(--bg)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={currentQuestion ? 'Type your answer...' : 'Waiting for question...'} disabled={!currentQuestion || submitting}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--text-h)', fontSize: '15px', fontFamily: 'Inter, sans-serif', resize: 'none', minHeight: '52px', maxHeight: '140px', outline: 'none', lineHeight: 1.5 }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            onFocus={e => { e.target.style.borderColor = '#292524'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
          />
          <button type="submit" disabled={submitting || !answer.trim() || !currentQuestion} className="el-btn-primary" style={{ height: '52px', width: '52px', padding: 0, borderRadius: '12px', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 8L2.5 2l2 6-2 6z" fill="white"/></svg>
          </button>
        </form>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default InterviewChat;
