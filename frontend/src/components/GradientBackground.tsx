import { useTheme } from '../contexts/ThemeContext';

export default function GradientBackground() {
  const { theme } = useTheme();
  
  const bg = theme === 'dark' ? '#0c0a09' : '#f5f5f5';
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', background: bg }}>
      {/* Mint orb — top left */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #a7e5d3 0%, transparent 65%)', opacity: theme === 'dark' ? 0.12 : 0.55, filter: 'blur(60px)' }} />
      {/* Peach orb — top right */}
      <div style={{ position: 'absolute', top: '5%', right: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #f4c5a8 0%, transparent 65%)', opacity: theme === 'dark' ? 0.1 : 0.45, filter: 'blur(70px)' }} />
      {/* Lavender orb — center left */}
      <div style={{ position: 'absolute', top: '40%', left: '10%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, #c8b8e0 0%, transparent 65%)', opacity: theme === 'dark' ? 0.1 : 0.35, filter: 'blur(80px)' }} />
      {/* Sky orb — bottom right */}
      <div style={{ position: 'absolute', bottom: '-5%', right: '5%', width: '550px', height: '550px', borderRadius: '50%', background: 'radial-gradient(circle, #a8c8e8 0%, transparent 65%)', opacity: theme === 'dark' ? 0.1 : 0.4, filter: 'blur(70px)' }} />
      {/* Rose orb — bottom left */}
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #e8b8c4 0%, transparent 65%)', opacity: theme === 'dark' ? 0.08 : 0.3, filter: 'blur(60px)' }} />
    </div>
  );
}
