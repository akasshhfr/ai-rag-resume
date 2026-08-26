import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      backgroundColor: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Wordmark */}
        <Link to="/" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '20px', fontWeight: 300, letterSpacing: '-0.3px', color: 'var(--text-h)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Target / bullseye logo */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer red ring */}
            <circle cx="14" cy="18" r="13" fill="#E8344A"/>
            {/* White ring */}
            <circle cx="14" cy="18" r="9.5" fill="white"/>
            {/* Middle red ring */}
            <circle cx="14" cy="18" r="7" fill="#E8344A"/>
            {/* Inner white ring */}
            <circle cx="14" cy="18" r="4.5" fill="white"/>
            {/* Bullseye center */}
            <circle cx="14" cy="18" r="2.5" fill="#E8344A"/>
            {/* Arrow shaft — diagonal from top-right to center */}
            <line x1="29" y1="3" x2="14.5" y2="17.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Arrow tip */}
            <circle cx="14" cy="18" r="1" fill="#6B7280"/>
            {/* Arrow fletching — golden/amber tail */}
            <path d="M28 4 L31 1.5 L29.5 5 L32 6 L28 4Z" fill="#F59E0B"/>
            <path d="M28 4 L25.5 2.5 L29 1.5 L28 4Z" fill="#D97706"/>
          </svg>
          AI Resume Coach
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '9999px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'background-color 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-strong)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            <>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>{user.email}</span>
              <button onClick={handleLogout} className="el-btn-outline" style={{ height: '36px', padding: '8px 16px', gap: '6px', display: 'flex', alignItems: 'center' }}>
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>Sign in</Link>
              <Link to="/register" className="el-btn-primary" style={{ textDecoration: 'none', height: '36px', padding: '8px 16px', fontSize: '14px' }}>Try free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
