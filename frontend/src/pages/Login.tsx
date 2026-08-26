import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      await login(res.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      {/* Hero text — above the card */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '480px' }}>
        <p className="el-caption-upper" style={{ marginBottom: '16px' }}>AI Resume Analyzer</p>
        <h1 className="el-display-xl" style={{ marginBottom: '12px' }}>Analyze your resume,<br/>land the role.</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.5, letterSpacing: '0.16px' }}>Get your ATS score, find skill gaps, and practice with an AI interviewer.</p>
      </div>

      {/* Card */}
      <div className="el-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <p className="el-caption-upper" style={{ marginBottom: '24px' }}>Sign in to your account</p>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--text-h)', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.16px' }}
              onFocus={e => { e.target.style.borderColor = '#292524'; e.target.style.boxShadow = '0 0 0 2px rgba(41,37,36,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-card)', color: 'var(--text-h)', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.16px' }}
              onFocus={e => { e.target.style.borderColor = '#292524'; e.target.style.boxShadow = '0 0 0 2px rgba(41,37,36,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button type="submit" disabled={loading} className="el-btn-primary" style={{ width: '100%', marginTop: '8px', height: '44px', fontSize: '15px' }}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
