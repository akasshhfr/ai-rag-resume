import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resResumes, resAnalyses] = await Promise.all([
          api.listResumes(),
          api.listAnalyses()
        ]);
        setResumes(resResumes.data);
        setAnalyses(resAnalyses.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div>
          <p className="el-caption-upper" style={{ marginBottom: '8px' }}>Dashboard</p>
          <h1 className="el-display-lg">Your workspace</h1>
        </div>
        <Link to="/upload" className="el-btn-primary" style={{ textDecoration: 'none' }}>+ New analysis</Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Analyses card */}
          <div className="el-card" style={{ padding: '32px' }}>
            <p className="el-caption-upper" style={{ marginBottom: '20px' }}>Recent analyses</p>
            {analyses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>No analyses yet</p>
                <Link to="/upload" className="el-btn-outline" style={{ textDecoration: 'none' }}>Run your first</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {analyses.map((a: any) => (
                  <Link key={a.id} to={`/analysis/${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)' }}>Analysis</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '28px', fontWeight: 300, color: a.ats_score >= 80 ? '#16a34a' : a.ats_score >= 60 ? '#b45309' : '#dc2626' }}>{a.ats_score}%</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resumes card */}
          <div className="el-card" style={{ padding: '32px' }}>
            <p className="el-caption-upper" style={{ marginBottom: '20px' }}>Uploaded resumes</p>
            {resumes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontFamily: 'Inter, sans-serif', marginBottom: '16px' }}>No resumes uploaded</p>
                <Link to="/upload" className="el-btn-outline" style={{ textDecoration: 'none' }}>Upload now</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {resumes.map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.filename}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(r.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
