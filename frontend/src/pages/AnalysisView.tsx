import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScoreGauge from '../components/ScoreGauge';
import StatusBadge from '../components/StatusBadge';

const AnalysisView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);

  useEffect(() => {
    if (id) {
      api.getAnalysis(id)
        .then(res => setAnalysis(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleStartInterview = async () => {
    if (!analysis) return;
    setStartingInterview(true);
    try {
      const res = await api.startInterview({
        resume_id: analysis.resume_id,
        analysis_session_id: analysis.id
      });
      navigate(`/interview/${res.data.session_id}`, {
        state: {
          question: res.data.question,
          difficulty: res.data.difficulty,
        },
      });
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Failed to start interview';
      alert('Error: ' + detail);
      setStartingInterview(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '96px', fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)' }}>Loading analysis...</div>;
  if (!analysis) return <div style={{ display: 'flex', justifyContent: 'center', padding: '96px', fontFamily: 'Inter, sans-serif', color: '#dc2626' }}>Analysis not found.</div>;

  const rawSkillGaps = typeof analysis.skill_gaps === 'string' ? JSON.parse(analysis.skill_gaps) : analysis.skill_gaps;
  const rawRoadmap = typeof analysis.roadmap === 'string' ? JSON.parse(analysis.roadmap) : analysis.roadmap;
  const skillGaps = Array.isArray(rawSkillGaps) ? rawSkillGaps : (rawSkillGaps?.gaps || []);
  const roadmap = Array.isArray(rawRoadmap) ? rawRoadmap : (rawRoadmap?.roadmap || []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div>
          <p className="el-caption-upper" style={{ marginBottom: '8px' }}>Analysis Results</p>
          <h1 className="el-display-lg">Resume match report</h1>
        </div>
        <button onClick={handleStartInterview} disabled={startingInterview} className="el-btn-primary">
          {startingInterview ? 'Starting...' : 'Practice interview →'}
        </button>
      </div>

      {/* Score + Gaps: two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
        {/* Score */}
        <div className="el-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <ScoreGauge score={analysis.ats_score} size={160} label="ATS Match" />
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="el-badge" style={analysis.ats_score >= 80 ? { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' } : analysis.ats_score >= 60 ? { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' } : { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {analysis.ats_score >= 80 ? 'Strong match' : analysis.ats_score >= 60 ? 'Good match' : 'Needs work'}
            </span>
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="el-card" style={{ padding: '32px' }}>
          <p className="el-caption-upper" style={{ marginBottom: '20px' }}>Skill gaps identified</p>
          {skillGaps.length === 0 ? (
            <p style={{ color: '#16a34a', fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>✓ Great match — no significant gaps found.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skillGaps.map((gap: any, i: number) => {
                const name = typeof gap === 'string' ? gap : gap.skill;
                const importance = typeof gap === 'object' ? gap.importance : '';
                const variant = importance === 'high' ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' } : importance === 'medium' ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a' } : { bg: '#f5f5f4', color: '#4e4e4e', border: '#e7e5e4' };
                return (
                  <span key={i} className="el-badge" style={{ backgroundColor: variant.bg, color: variant.color, border: `1px solid ${variant.border}` }}>{name}</span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Roadmap */}
      <div className="el-card" style={{ padding: '40px' }}>
        <p className="el-caption-upper" style={{ marginBottom: '8px' }}>Learning Roadmap</p>
        <h2 className="el-display-md" style={{ marginBottom: '40px' }}>Your path to the role</h2>
        {roadmap.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>No roadmap generated.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {roadmap.map((step: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: '24px', animation: `fadeSlideUp 0.4s ease both`, animationDelay: `${idx * 80}ms`, opacity: 0 }}>
                <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'EB Garamond', Georgia, serif", fontSize: '18px', fontWeight: 300 }}>{step.month || idx + 1}</div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <h3 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '20px', fontWeight: 300, color: 'var(--text-h)', marginBottom: '8px' }}>{step.focus || step.title || step.step || `Step ${idx + 1}`}</h3>
                  {step.skills && Array.isArray(step.skills) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>{step.skills.map((s: string, si: number) => <span key={si} className="el-badge">{s}</span>)}</div>
                  )}
                  {step.tasks && Array.isArray(step.tasks) && (
                    <ul style={{ margin: '0 0 10px', paddingLeft: '18px', fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--text-body)', lineHeight: 1.6 }}>{step.tasks.map((t: string, ti: number) => <li key={ti}>{t}</li>)}</ul>
                  )}
                  {step.description && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.description}</p>}
                  {step.resources && Array.isArray(step.resources) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>{step.resources.map((r: string, ri: number) => <span key={ri} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>{r}</span>)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
