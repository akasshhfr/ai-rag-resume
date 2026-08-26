import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Trash2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteAnalysis = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    setDeletingId(id);
    try {
      await api.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete analysis', err);
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume? All associated analyses will also be deleted.')) return;

    setDeletingId(id);
    try {
      await api.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      // Refresh analyses since cascade delete will remove associated ones
      const resAnalyses = await api.listAnalyses();
      setAnalyses(resAnalyses.data);
    } catch (err) {
      console.error('Failed to delete resume', err);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <Link
                      to={`/analysis/${a.id}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textDecoration: 'none',
                        marginRight: '16px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)' }}>Analysis</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '28px', fontWeight: 300, color: a.ats_score >= 80 ? '#16a34a' : a.ats_score >= 60 ? '#b45309' : '#dc2626' }}>
                        {a.ats_score}%
                      </span>
                    </Link>
                    <button
                      onClick={(e) => handleDeleteAnalysis(e, a.id)}
                      disabled={deletingId === a.id}
                      title="Delete analysis"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.filename}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(r.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteResume(e, r.id)}
                      disabled={deletingId === r.id}
                      title="Delete resume"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
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
