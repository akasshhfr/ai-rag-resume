import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import ScoreGauge from '../components/ScoreGauge';

const InterviewSummary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionId) {
      api.getInterviewSummary(sessionId)
        .then(res => setSummary(res.data))
        .catch(err => {
          console.error(err);
          setError('Failed to load summary');
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '96px', fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)' }}>Loading summary...</div>;
  if (error || !summary) return <div style={{ display: 'flex', justifyContent: 'center', padding: '96px', fontFamily: 'Inter, sans-serif', color: '#dc2626' }}>{error || 'Summary not found'}</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
      {/* Trophy header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 3h12M6 3v6a6 6 0 0012 0V3M6 3H3v6a3 3 0 003 3M18 3h3v6a3 3 0 01-3 3M12 15v4M8 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p className="el-caption-upper" style={{ marginBottom: '12px' }}>Interview complete</p>
        <h1 className="el-display-lg">Your performance</h1>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="el-card" style={{ padding: '32px', textAlign: 'center' }}>
          <ScoreGauge score={Math.round(summary.average_score * 100)} size={100} label="Score" />
        </div>
        <div className="el-card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="el-caption-upper" style={{ marginBottom: '8px' }}>Questions</p>
          <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '48px', fontWeight: 300, color: 'var(--text-h)', lineHeight: 1 }}>{summary.total_turns}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>answered</p>
        </div>
        <div className="el-card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="el-caption-upper" style={{ marginBottom: '12px' }}>Difficulty</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            {(summary.difficulty_progression || []).map((d: string, i: number) => (
              <div key={i} style={{ width: '10px', height: '32px', borderRadius: '4px', backgroundColor: d === 'hard' ? '#dc2626' : d === 'medium' ? '#b45309' : '#16a34a' }} title={`Turn ${i+1}: ${d}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Overall feedback */}
      {summary.overall_feedback && (
        <div className="el-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '3px solid var(--color-primary)' }}>
          <p className="el-caption-upper" style={{ marginBottom: '16px' }}>Overall feedback</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: 'var(--text-body)', lineHeight: 1.6, letterSpacing: '0.16px' }}>{summary.overall_feedback}</p>
        </div>
      )}

      {/* Turn by turn */}
      <div style={{ marginBottom: '48px' }}>
        <p className="el-caption-upper" style={{ marginBottom: '24px' }}>Turn by turn</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(summary.turns || []).map((turn: any, idx: number) => {
            const score = turn.score ?? turn.evaluation_score;
            const scoreNum = typeof score === 'number' ? score : 0;
            const scoreDisplay = typeof score === 'number' ? (score * 10).toFixed(1) : '—';
            const difficulty = turn.difficulty || turn.difficulty_level || 'medium';
            return (
              <div key={idx} className="el-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="el-badge">Turn {idx + 1}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="el-badge" style={{ backgroundColor: difficulty === 'hard' ? '#fef2f2' : difficulty === 'medium' ? '#fffbeb' : '#f0fdf4', color: difficulty === 'hard' ? '#dc2626' : difficulty === 'medium' ? '#b45309' : '#16a34a', border: `1px solid ${difficulty === 'hard' ? '#fecaca' : difficulty === 'medium' ? '#fde68a' : '#bbf7d0'}` }}>{difficulty}</span>
                    <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '20px', fontWeight: 300, color: scoreNum >= 0.8 ? '#16a34a' : scoreNum >= 0.5 ? '#b45309' : '#dc2626' }}>{scoreDisplay}/10</span>
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '10px', lineHeight: 1.5 }}>{turn.question}</p>
                {(turn.answer || turn.user_answer) && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.55, paddingLeft: '14px', borderLeft: '2px solid var(--border)' }}>{turn.answer || turn.user_answer}</p>
                )}
                {turn.feedback && (
                  <div style={{ backgroundColor: 'var(--bg-strong)', borderRadius: '8px', padding: '12px 16px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>{turn.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <a href="/" style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--text-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>← Back to dashboard</a>
      </div>
    </div>
  );
};

export default InterviewSummary;
