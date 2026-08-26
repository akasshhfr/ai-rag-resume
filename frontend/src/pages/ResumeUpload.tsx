import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jdTitle || !jdText) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload Resume
      const resumeRes = await api.uploadResume(file);
      const resumeId = resumeRes.data.id;

      // 2. Create Job Description
      const jdRes = await api.createJobDescription({ title: jdTitle, raw_text: jdText });
      const jdId = jdRes.data.id;

      // 3. Run Analysis
      const analysisRes = await api.runAnalysis({ resume_id: resumeId, job_description_id: jdId });
      
      // Navigate to results
      navigate(`/analysis/${analysisRes.data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during processing');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 32px' }}>
      <p className="el-caption-upper" style={{ marginBottom: '12px' }}>New Analysis</p>
      <h1 className="el-display-lg" style={{ marginBottom: '8px' }}>Analyze your resume</h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: 'var(--text-muted)', marginBottom: '48px', letterSpacing: '0.16px' }}>Upload your resume and a job description to get your ATS match score and a personalized roadmap.</p>

      {error && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Resume upload */}
        <div className="el-card" style={{ padding: '32px' }}>
          <p className="el-caption-upper" style={{ marginBottom: '20px' }}>Resume (PDF)</p>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} id="resume-upload" style={{ display: 'none' }} />
          <label htmlFor="resume-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-strong)', borderRadius: '12px', padding: '48px 32px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.15s ease, background-color 0.15s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#292524'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            {file ? (
              <>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)' }}>{file.name}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#16a34a', marginTop: '4px' }}>Ready to analyze</p>
              </>
            ) : (
              <>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12V4M5.5 7L9 3.5 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '4px' }}>Drop your PDF here</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)' }}>or click to browse</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-muted-soft)', marginTop: '12px' }}>PDF only · We never share your data</p>
              </>
            )}
          </label>
        </div>

        {/* Job description */}
        <div className="el-card" style={{ padding: '32px' }}>
          <p className="el-caption-upper" style={{ marginBottom: '20px' }}>Target Job</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>Job title</label>
              <input type="text" value={jdTitle} onChange={e => setJdTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--text-h)', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#292524'; e.target.style.boxShadow = '0 0 0 2px rgba(41,37,36,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>Job description</label>
              <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full job description here..." rows={7}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--text-h)', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }}
                onFocus={e => { e.target.style.borderColor = '#292524'; e.target.style.boxShadow = '0 0 0 2px rgba(41,37,36,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !file || !jdTitle || !jdText} className="el-btn-primary" style={{ width: '100%', height: '48px', fontSize: '16px', borderRadius: '12px' }}>
          {loading ? 'Analyzing...' : 'Analyze my resume →'}
        </button>
      </form>
    </div>
  );
};

export default ResumeUpload;
